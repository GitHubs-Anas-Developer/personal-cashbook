import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { config } from './config/index.js';

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log(`[Server] Personal Cashbook API running in ${config.env} mode on http://localhost:${config.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Server] Critical startup error:', error);
    process.exit(1);
  }
}

startServer();
