import mongoose from 'mongoose';
import { config } from './index.js';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      autoIndex: true, // build indexes in development/production
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Attempting to reconnect...');
      isConnected = false;
    });

    return conn.connection;
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected gracefully');
  }
}
