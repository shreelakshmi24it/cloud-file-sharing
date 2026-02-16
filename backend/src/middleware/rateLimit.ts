
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../utils/redis';
import config from '../config';

// Check if Redis is connected
const useRedis = redis.checkConnection();

if (useRedis) {
    console.log('✅ Rate Limiting: Using Redis Store');
} else {
    console.warn('⚠️  Rate Limiting: Using Memory Store (Redis not connected)');
}

const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    store: useRedis ? new RedisStore({
        sendCommand: (...args: string[]) => redis.getClient().sendCommand(args),
    }) : undefined, // Fallback to memory store
});

export default limiter;
