import { startServer } from './src/server/server.js';
import { startScraper } from './src/scraper/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;
const url = process.argv[2]; // Get URL from command line argument

// Start the server
startServer(PORT);

// Start the scraper
startScraper(url);