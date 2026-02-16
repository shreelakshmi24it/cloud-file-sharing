import config from './config';

import db from './database/connection';
import redis from './utils/redis';

const PORT = config.port;

async function startServer() {
    try {
        console.log('\n🚀 Starting SecureCloud Backend Server...\n');

        // Connect to database (required)
        console.log('📦 Connecting to PostgreSQL...');
        await db.connect();

        // Connect to Redis (optional - don't fail if Redis is unavailable)
        try {
            console.log('📦 Connecting to Redis...');
            await redis.connect();
        } catch (redisError) {
            console.warn('⚠️  Redis connection failed - continuing without cache');
            console.warn('   Error:', redisError instanceof Error ? redisError.message : redisError);
        }

        // Start Express server
        const app = (await import('./app')).default;
        const server = app.listen(PORT, '0.0.0.0', () => {

            console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 SecureCloud Backend Server                          ║
║                                                           ║
║   Environment: ${config.env.padEnd(43)}║
║   Port: ${PORT.toString().padEnd(50)}║
║   API URL: ${config.apiUrl.padEnd(47)}║
║                                                           ║
║   📡 Server is running and ready to accept requests      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
            `);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n⏳ Shutting down gracefully...');
            server.close(async () => {
                await db.disconnect();
                try {
                    await redis.disconnect();
                } catch (err) {
                    console.log('Redis was not connected');
                }
                console.log('✅ Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('\n❌ Failed to start server:');
        console.error(error);
        console.error('\nStack trace:');
        console.error(error instanceof Error ? error.stack : 'No stack trace available');
        process.exit(1);
    }
}

startServer().catch((error) => {
    console.error('\n❌ Unhandled error during server startup:');
    console.error(error);
    process.exit(1);
});
