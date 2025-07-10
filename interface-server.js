import { startServer } from './src/server/server.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

console.log('Starting Bot Management Interface Server...');
console.log('Note: This will NOT start any scrapers automatically.');
console.log('Use the web interface to manage bots.');

// Start only the server (no automatic scraper)
startServer(PORT);
