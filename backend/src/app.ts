import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import config from './config';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import shareRoutes from './routes/share';
import folderRoutes from './routes/folders';
import settingsRoutes from './routes/settings';

const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition', 'Content-Length', 'Content-Type'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        if (req.path.includes('/download')) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Logging middleware
if (config.env === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

// API routes
app.get('/api', (_req: Request, res: Response) => {
    res.json({
        message: 'SecureCloud API v1.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            files: '/api/files',
            folders: '/api/folders',
            share: '/api/share',
            settings: '/api/settings',
        },
    });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/settings', settingsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
    });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
        error: 'Internal Server Error',
        message: config.env === 'development' ? err.message : 'Something went wrong',
        ...(config.env === 'development' && { stack: err.stack }),
    });
});

export default app;
