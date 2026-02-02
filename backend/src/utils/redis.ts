import { createClient, RedisClientType } from 'redis';
import config from '../config';

/**
 * Redis Client Utility
 * 
 * Provides a singleton Redis client for:
 * - Session storage
 * - Rate limiting
 * - Caching
 * - Token blacklist
 */
class RedisClient {
    private static instance: RedisClient;
    private client: RedisClientType;
    private isConnected: boolean = false;

    private constructor() {
        const options: any = {};

        if (config.redis.url) {
            options.url = config.redis.url;
            console.log('Redis client configured with connection URL');
        } else {
            options.socket = {
                host: config.redis.host,
                port: config.redis.port,
            };
            if (config.redis.password) {
                options.password = config.redis.password;
            }
            console.log(`Redis client configured with host: ${config.redis.host}:${config.redis.port}`);
        }

        this.client = createClient(options);

        // Error handler
        this.client.on('error', (err) => {
            // Only log errors if we were previously connected or if it's not a connection refused error during startup
            // (which is handled by the initial connect() call)
            if (this.isConnected || (err.code !== 'ECONNREFUSED')) {
                console.error('Redis Client Error:', err.message);
            }
            this.isConnected = false;
        });

        // Connection handler
        this.client.on('connect', () => {
            // console.log('✅ Redis Client Connected'); // Reduce noise
            this.isConnected = true;
        });

        // Disconnection handler
        this.client.on('disconnect', () => {
            if (this.isConnected) {
                console.log('❌ Redis Client Disconnected');
            }
            this.isConnected = false;
        });
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): RedisClient {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }

    /**
     * Connect to Redis
     */
    public async connect(): Promise<void> {
        if (!this.isConnected) {
            try {
                if (config.redis.url) {
                    // Mask password in logs
                    const maskedUrl = config.redis.url.replace(/:([^@]+)@/, ':****@');
                    console.log(`Attempting to connect to Redis URL: ${maskedUrl}`);
                } else {
                    console.log(`Attempting to connect to Redis: ${config.redis.host}:${config.redis.port}`);
                }

                await this.client.connect();
                console.log('✅ Redis connected successfully');
            } catch (error) {
                console.error('❌ Redis connection failed:', error instanceof Error ? error.message : error);
                throw error;
            }
        }
    }

    /**
     * Disconnect from Redis
     */
    public async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            console.log('Redis connection closed');
        }
    }

    /**
     * Get the underlying Redis client
     */
    public getClient(): RedisClientType {
        return this.client;
    }

    /**
     * Check if Redis is connected
     */
    public checkConnection(): boolean {
        return this.isConnected;
    }

    // ==========================================
    // CACHE OPERATIONS
    // ==========================================

    /**
     * Set a value in cache with optional TTL
     */
    public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        try {
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, value);
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Get a value from cache
     */
    public async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Delete a key from cache
     */
    public async del(key: string): Promise<void> {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Check if a key exists
     */
    public async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error(`Redis EXISTS error for key ${key}:`, error);
            throw error;
        }
    }

    /**
     * Set expiration on a key
     */
    public async expire(key: string, seconds: number): Promise<void> {
        try {
            await this.client.expire(key, seconds);
        } catch (error) {
            console.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }

    // ==========================================
    // TOKEN BLACKLIST OPERATIONS
    // ==========================================

    /**
     * Add a token to the blacklist
     * TTL should match token expiration time
     */
    public async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
        const key = `blacklist:${token}`;
        await this.set(key, 'revoked', ttlSeconds);
    }

    /**
     * Check if a token is blacklisted
     */
    public async isTokenBlacklisted(token: string): Promise<boolean> {
        const key = `blacklist:${token}`;
        return await this.exists(key);
    }

    // ==========================================
    // SESSION OPERATIONS
    // ==========================================

    /**
     * Store session data
     */
    public async setSession(sessionId: string, data: any, ttlSeconds: number): Promise<void> {
        const key = `session:${sessionId}`;
        await this.set(key, JSON.stringify(data), ttlSeconds);
    }

    /**
     * Get session data
     */
    public async getSession(sessionId: string): Promise<any | null> {
        const key = `session:${sessionId}`;
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Delete session
     */
    public async deleteSession(sessionId: string): Promise<void> {
        const key = `session:${sessionId}`;
        await this.del(key);
    }

    // ==========================================
    // CACHE HELPERS (for data caching)
    // ==========================================

    /**
     * Cache an object with JSON serialization
     */
    public async cacheObject(key: string, obj: any, ttlSeconds?: number): Promise<void> {
        await this.set(key, JSON.stringify(obj), ttlSeconds);
    }

    /**
     * Get cached object with JSON parsing
     */
    public async getCachedObject<T>(key: string): Promise<T | null> {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Invalidate cache by pattern
     * WARNING: Use carefully in production
     */
    public async invalidateByPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
        } catch (error) {
            console.error(`Redis invalidate pattern error for ${pattern}:`, error);
            throw error;
        }
    }
}

// Export singleton instance
export default RedisClient.getInstance();
