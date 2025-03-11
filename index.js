import axios from 'axios';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const url = process.argv[2]; // Get URL from command line argument
const filePath = path.join(__dirname, 'data.json');
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const headers = {
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'max-age=0',
  'priority': 'u=0, i',
  'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

const clearTerminal = () => {
  exec('cls', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error clearing terminal: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error clearing terminal: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
};

const sendMessage = async (message) => {
  try {
    await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      params: {
        chat_id: CHAT_ID,
        text: message,
      },
    });
  } catch (error) {
    console.error(`Error sending message: ${error.message}`);
  }
};

const scrapeData = async (url) => {
    try {
      const response = await axios.get(url, { headers });
      const $ = cheerio.load(response.data);
      const items = $('ul.srp-results.srp-grid.clearfix li[data-viewport], li.s-item.s-item__pl-on-bottom[id]');
      const temp = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  
      items.each((index, item) => {
        const title = $(item).find('div.s-item__title').text().trim();
        const itemUrl = $(item).find('a[data-interactions]').attr('href');
        if (itemUrl) {
          const cleanItemUrl = itemUrl.split('?')[0];
          const image = $(item).find('div.s-item__image-wrapper.image-treatment img').attr('src');
          const price = $(item).find('div.s-item__details-section--primary').text().trim();
          const value = `${cleanItemUrl}\n${title}\n${price}\n${image}`;
  
          if (!temp[cleanItemUrl]) {
            temp[cleanItemUrl] = cleanItemUrl;
            console.log(`NEW PRODUCT FOUND ::: ${cleanItemUrl}`);
            sendMessage(value);
            fs.writeFileSync(filePath, JSON.stringify(temp, null, 4), 'utf-8');
          }
        }
      });
    } catch (error) {
      console.error(`Error scraping data: ${error.message}`);
    }
  };

const main = async () => {
  let NR = 1;
  let FS_ = 1;

  while (true) {
    try {
      await scrapeData(url);
      NR += 1;
      console.log('All requests completed.');

      if (NR % 10 === 0) {
        console.log('--------clearing output----------------');
        clearTerminal();
        FS_ += 1;

        if (FS_ % 8640 === 0 && FS_ !== 0) {
          const MD_V = `Total requests made today: ${FS_}  ::${new Date().toISOString()}`;
          sendMessage(MD_V);
          FS_ = 0;
        }
      }
    } catch (error) {
      console.error(`ERROR :::: ${error.message}`);
      sendMessage('ISSUE FOUND Restarting');
    }
  }
};

main();