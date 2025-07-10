import { startScraper } from './src/scraper/index.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const url = args[0];

// Parse bot token and chat ID from command line arguments
let botToken = process.env.BOT_TOKEN; // Fallback to .env for backward compatibility
let chatId = process.env.CHAT_ID; // Fallback to .env for backward compatibility
let botId = null;

// Look for --bot-token, --chat-id, and --bot-id flags
const botTokenIndex = args.indexOf('--bot-token');
const chatIdIndex = args.indexOf('--chat-id');
const botIdIndex = args.indexOf('--bot-id');

if (botTokenIndex !== -1 && args[botTokenIndex + 1]) {
  botToken = args[botTokenIndex + 1];
}

if (chatIdIndex !== -1 && args[chatIdIndex + 1]) {
  chatId = args[chatIdIndex + 1];
}

if (botIdIndex !== -1 && args[botIdIndex + 1]) {
  botId = args[botIdIndex + 1];
}

if (!url) {
  console.error('Error: No URL provided. Please provide a URL as a command line argument.');
  console.log('Usage: node scraper-only.js "https://www.ebay.com/sch/i.html?_nkw=your+search+terms" --bot-token <token> --chat-id <id> [--bot-id <id>]');
  process.exit(1);
}

if (!botToken || !chatId) {
  console.error('Error: Bot token and chat ID are required.');
  console.log('Usage: node scraper-only.js "https://www.ebay.com/sch/i.html?_nkw=your+search+terms" --bot-token <token> --chat-id <id> [--bot-id <id>]');
  process.exit(1);
}

// Create bot-specific data paths if botId is provided
let botDataPaths = null;
if (botId) {
  const projectRoot = path.resolve(__dirname, './');
  const botDataDir = path.join(projectRoot, 'data', 'bots', botId);
  
  // Create bot data directory if it doesn't exist
  if (!fs.existsSync(botDataDir)) {
    fs.mkdirSync(botDataDir, { recursive: true });
  }
  
  botDataPaths = {
    dataPath: path.join(botDataDir, 'data.json'),
    mlDataPath: path.join(botDataDir, 'ml_data.json'),
    notificationsPath: path.join(botDataDir, 'notifications.json')
  };
  
  // Initialize bot-specific data files
  if (!fs.existsSync(botDataPaths.dataPath)) {
    fs.writeFileSync(botDataPaths.dataPath, JSON.stringify({}, null, 4), 'utf-8');
  }
  if (!fs.existsSync(botDataPaths.mlDataPath)) {
    fs.writeFileSync(botDataPaths.mlDataPath, JSON.stringify([], null, 4), 'utf-8');
  }
  if (!fs.existsSync(botDataPaths.notificationsPath)) {
    fs.writeFileSync(botDataPaths.notificationsPath, JSON.stringify([], null, 4), 'utf-8');
  }
}

console.log('Starting scraper only (no server)...');
console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
console.log(`Chat ID: ${chatId}`);
if (botId) {
  console.log(`Bot ID: ${botId}`);
  console.log(`Bot Data Directory: ${botDataPaths ? path.dirname(botDataPaths.dataPath) : 'N/A'}`);
}

startScraper(url, botToken, chatId, botDataPaths);
