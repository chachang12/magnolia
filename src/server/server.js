import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import routes from './routes/routes.js';
import { initializeFiles } from '../shared/models.js';
import { wsManager } from './services/WebSocketManager.js';
import { botManager } from './services/BotManager.js';
import { memoryMonitor } from './services/MemoryMonitor.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Initialize required files
initializeFiles();

export const startServer = (port) => {
  const app = express();
  const server = createServer(app);
  
  // Configure middleware with proper CORS settings
  app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition']
  }));
  
  app.use(express.json());
  
  // Serve static files from the 'public' directory
  app.use(express.static(path.join(projectRoot, 'public')));
  
  // Use routes
  app.use(routes);
  
  // Initialize WebSocket manager
  wsManager.initialize(server);
  
  // Setup graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...');
    
    try {
      // Stop memory monitoring
      memoryMonitor.stopMonitoring();
      
      // Stop all bots
      await botManager.shutdown();
      
      // Close WebSocket connections
      wsManager.shutdown();
      
      // Close server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Start the server
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Bot Management API available at http://localhost:${port}/api/bots`);
    console.log(`WebSocket available at ws://localhost:${port}`);
    console.log(`Images should be accessible at http://localhost:${port}/images/[image-name]`);
    
    // Start memory monitoring
    memoryMonitor.startMonitoring(60000); // Monitor every minute
    console.log('📊 Memory monitoring started');
  });
  
  return { app, server };
};