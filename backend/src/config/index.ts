import dotenv from 'dotenv';

dotenv.config();

interface Config {
    env: string;
    port: number;
    apiUrl: string;
    frontendUrl: string;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    redis: {
        host: string;
        port: number;
        password: string;
        url?: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3BucketName: string;
    };
    email: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    upload: {
        maxFileSize: number;
        allowedFileTypes: string;
    };
}

// Parse DATABASE_URL if provided (for Railway, Heroku, etc.)
function parseDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
        try {
            const url = new URL(databaseUrl);
            return {
                host: url.hostname,
                port: parseInt(url.port || '5432', 10),
                name: url.pathname.slice(1), // Remove leading '/'
                user: url.username,
                password: url.password,
            };
        } catch (error) {
            console.error('Error parsing DATABASE_URL:', error);
            // Fall back to individual env vars
            return null;
        }
    }
    return null;
}

const parsedDbConfig = parseDatabaseUrl();

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    apiUrl: process.env.API_URL || 'http://localhost:5000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    database: parsedDbConfig || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'cloud_file_sharing',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },

    redis: {
        url: process.env.REDIS_URL || undefined,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    aws: {
        region: process.env.AWS_REGION || 'eu-north-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        s3BucketName: process.env.S3_BUCKET_NAME || '',
    },

    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'SecureCloud <noreply@securecloud.com>',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
        allowedFileTypes: process.env.ALLOWED_FILE_TYPES || 'image/*,video/*,audio/*,application/pdf,application/zip',
    },
};

export default config;
