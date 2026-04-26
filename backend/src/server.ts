import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school-bus-db';

import { createServer } from 'http';
import { initSocket } from './socket';

const startServer = async () => {
  try {
    // Database connection
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const httpServer = createServer(app);
    initSocket(httpServer);

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`📡 WebSocket server initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
