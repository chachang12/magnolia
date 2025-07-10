import { startScraper } from './src/scraper/index.js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.argv[2]; // Get URL from command line argument

if (!url) {
  console.error('Error: No URL provided. Please provide a URL as a command line argument.');
  console.log('Usage: node scraper-only.js "https://www.ebay.com/sch/i.html?_nkw=your+search+terms"');
  process.exit(1);
}

console.log('Starting scraper only (no server)...');
startScraper(url);
