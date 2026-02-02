import app from './app';
import config from './config';
import db from './database/connection';

const PORT = config.port;

async function startServer() {
    try {
        // Connect to database
        await db.connect();

        // Start Express server
        const server = app.listen(PORT, () => {
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
            console.log('\nShutting down gracefully...');
            server.close(async () => {
                await db.disconnect();
                console.log('Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
