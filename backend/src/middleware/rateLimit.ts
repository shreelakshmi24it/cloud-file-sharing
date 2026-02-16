
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../utils/redis';
import config from '../config';

const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    store: new RedisStore({
        sendCommand: (...args: string[]) => redis.getClient().sendCommand(args),
    }),
});

export default limiter;
