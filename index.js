import { startServer } from './src/server/server.js';
import { startScraper } from './src/scraper/index.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;
const url = process.argv[2]; // Get URL from command line argument

// Get bot token and chat ID from environment variables (for backward compatibility)
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

// Start the server
startServer(PORT);

// Start the scraper if URL is provided
if (url) {
  if (!botToken || !chatId) {
    console.error('Error: BOT_TOKEN and CHAT_ID must be set in .env file for the default scraper.');
    process.exit(1);
  }
  
  startScraper(url, botToken, chatId);
} else {
  console.log('No URL provided. Server started without automatic scraper.');
}