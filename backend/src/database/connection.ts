import { Pool, PoolClient, QueryResult } from 'pg';
import config from '../config';

class Database {
    private pool: Pool;
    private static instance: Database;

    private constructor() {
        this.pool = new Pool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Handle pool errors
        this.pool.on('error', (err: Error) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async query(text: string, params?: any[]): Promise<QueryResult> {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;

            if (config.env === 'development') {
                console.log('Executed query', { text, duration, rows: res.rowCount });
            }

            return res;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    public async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    public async connect(): Promise<void> {
        try {
            const client = await this.pool.connect();
            console.log('✅ Database connected successfully');
            console.log(`   Database: ${config.database.name}`);
            console.log(`   Host: ${config.database.host}:${config.database.port}`);
            client.release();
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        await this.pool.end();
        console.log('Database connection pool closed');
    }

    public async testConnection(): Promise<boolean> {
        try {
            const result = await this.query('SELECT NOW()');
            return result.rows.length > 0;
        } catch (error) {
            return false;
        }
    }
}

export default Database.getInstance();
