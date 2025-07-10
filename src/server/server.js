import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import routes from './routes/routes.js';
import { initializeFiles } from '../shared/models.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Initialize required files
initializeFiles();

export const startServer = (port) => {
  const app = express();
  
  // Configure middleware with proper CORS settings
  app.use(cors({
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition']
  }));
  
  app.use(express.json());
  
  // Serve static files from the 'public' directory
  app.use(express.static(path.join(projectRoot, 'public')));
  
  // Use routes
  app.use(routes);
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Images should be accessible at http://localhost:${port}/images/[image-name]`);
  });
  
  return app;
};