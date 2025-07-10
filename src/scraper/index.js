import axios from 'axios';
import { createRequire } from 'module';
import fs from 'fs';
import { exec } from 'child_process';
import { 
  headers, 
  filePath, 
  mlDataPath, 
  notificationsPath, 
  initializeFiles,
  createListingModel 
} from '../shared/models.js';

// Initialize required files
initializeFiles();

const require = createRequire(import.meta.url);
const cheerio = require('cheerio');

const clearTerminal = () => {
  const clearCmd = process.platform === 'win32' ? 'cls' : 'clear';
  
  exec(clearCmd, (error, stdout, stderr) => {
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

const saveNotification = async (message, botToken, chatId, notificationsFilePath = null) => {
  try {
    // Save to local notifications file
    const notifPath = notificationsFilePath || notificationsPath;
    const notifications = JSON.parse(fs.readFileSync(notifPath, 'utf-8'));
    notifications.push({
      message,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(notifPath, JSON.stringify(notifications, null, 4), 'utf-8');
    console.log(`Notification saved: ${message.substring(0, 50)}...`);

    // Send to Telegram if bot token and chat ID are provided
    if (botToken && chatId) {
      await sendTelegramNotification(message, botToken, chatId);
    }
  } catch (error) {
    console.error(`Error saving notification: ${error.message}`);
  }
};

const sendTelegramNotification = async (message, botToken, chatId) => {
  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    };

    const response = await axios.post(telegramUrl, payload);
    
    if (response.data.ok) {
      console.log('Telegram notification sent successfully');
    } else {
      console.error('Failed to send Telegram notification:', response.data.description);
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error.message);
  }
};

/**
 * Extracts and cleans price information from eBay listing text
 * @param {string} priceText - Raw price text from eBay listing
 * @returns {Object} - Object containing parsed price data
 */
const parsePriceInfo = (priceText) => {
  const priceInfo = {
    price: '',
    rawPrice: priceText,
    shipping: '',
    offerType: '',
    isAuction: false
  };

  // Extract main price - first currency amount in the string
  const mainPriceMatch = priceText.match(/\$\d+\.\d+|\$\d+/);
  if (mainPriceMatch) {
    priceInfo.price = mainPriceMatch[0];
  }

  // Check if it's an auction
  if (priceText.includes('bid') || priceText.includes('auction')) {
    priceInfo.isAuction = true;
  }

  // Check for Best Offer
  if (priceText.includes('Best Offer')) {
    priceInfo.offerType = 'Best Offer';
  }

  // Extract shipping cost
  const shippingMatch = priceText.match(/\+(\$\d+\.\d+|\$\d+)/);
  if (shippingMatch) {
    priceInfo.shipping = shippingMatch[1];
  } else if (priceText.includes('Free shipping') || priceText.includes('Free delivery')) {
    priceInfo.shipping = 'Free';
  }

  return priceInfo;
};

const scrapeData = async (url, botToken, chatId, botDataPaths = null) => {
  try {
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    const items = $('ul.srp-results.srp-grid.clearfix li[data-viewport], li.s-item.s-item__pl-on-bottom[id]');
    
    // Use bot-specific data paths if provided, otherwise use default paths
    const dataPath = botDataPaths?.dataPath || filePath;
    const mlDataFilePath = botDataPaths?.mlDataPath || mlDataPath;
    const notificationsFilePath = botDataPaths?.notificationsPath || notificationsPath;
    
    const temp = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    const mlData = JSON.parse(fs.readFileSync(mlDataFilePath, 'utf-8'));
    let newItemsAdded = false;

    items.each((index, item) => {
      const title = $(item).find('div.s-item__title').text().trim();
      const itemUrl = $(item).find('a[data-interactions]').attr('href');
      
      if (itemUrl) {
        const cleanItemUrl = itemUrl.split('?')[0];
        // TEMPORARILY DISABLED: Image processing
        // const image = $(item).find('div.s-item__image-wrapper.image-treatment img').attr('src');
        const image = 'IMAGE_DISABLED'; // Placeholder
        
        // Get raw price text
        const rawPriceText = $(item).find('div.s-item__details-section--primary').text().trim();
        
        // Parse price information
        const priceInfo = parsePriceInfo(rawPriceText);
        
        // Use clean price for notification (without image URL)
        const value = `${cleanItemUrl}\n${title}\n${priceInfo.price} ${priceInfo.shipping ? '+ ' + priceInfo.shipping + ' shipping' : ''}`;
        
        // Extract more data for ML model
        const condition = $(item).find('span.SECONDARY_INFO').text().trim() || 'Unknown';
        const seller = $(item).find('span.s-item__seller-info-text').text().trim() || 'Unknown';
        const location = $(item).find('span.s-item__location').text().trim() || 'Unknown';
        const shipping = priceInfo.shipping || $(item).find('span.s-item__shipping').text().trim() || 'Unknown';
        const itemId = cleanItemUrl.split('/').pop() || `item_${Date.now()}`;
        
        // Create listing model with enhanced price information (image disabled)
        const listingModel = createListingModel(
          itemId, cleanItemUrl, title, priceInfo.price, image, condition, seller, location, shipping,
          // Additional price-related data
          {
            rawPrice: priceInfo.rawPrice,
            offerType: priceInfo.offerType,
            isAuction: priceInfo.isAuction,
            shipping: priceInfo.shipping
          }
        );

        if (!temp[cleanItemUrl]) {
          temp[cleanItemUrl] = cleanItemUrl;
          console.log(`NEW PRODUCT FOUND ::: ${cleanItemUrl}`);
          console.log(`Price: ${priceInfo.price} (extracted from "${rawPriceText}")`);
          
          // Save notification (existing behavior)
          saveNotification(value, botToken, chatId, notificationsFilePath);
          
          // Add to ML dataset
          mlData.push(listingModel);
          newItemsAdded = true;
          
          // Update tracking file (existing behavior)
          fs.writeFileSync(dataPath, JSON.stringify(temp, null, 4), 'utf-8');
        }
      }
    });
    
    // Only write to ML data file if new items were added
    if (newItemsAdded) {
      fs.writeFileSync(mlDataFilePath, JSON.stringify(mlData, null, 4), 'utf-8');
      console.log(`ML data updated with new items. Total items: ${mlData.length}`);
    }
    
  } catch (error) {
    console.error(`Error scraping data: ${error.message}`);
  }
};

export const startScraper = async (url, botToken, chatId, botDataPaths = null) => {
  if (!url) {
    console.error('Error: No URL provided. Please provide a URL as a command line argument.');
    process.exit(1);
  }

  if (!botToken || !chatId) {
    console.error('Error: Bot token and chat ID are required for Telegram notifications.');
    process.exit(1);
  }

  console.log(`Starting scraper with URL: ${url}`);
  console.log(`Bot Token: ${botToken.substring(0, 10)}...`);
  console.log(`Chat ID: ${chatId}`);
  
  // Log data paths for debugging
  if (botDataPaths) {
    console.log(`Bot Data Paths:`);
    console.log(`  Data: ${botDataPaths.dataPath}`);
    console.log(`  ML Data: ${botDataPaths.mlDataPath}`);
    console.log(`  Notifications: ${botDataPaths.notificationsPath}`);
  }
  
  let NR = 1;
  let FS_ = 1;

  while (true) {
    try {
      await scrapeData(url, botToken, chatId, botDataPaths);
      NR += 1;
      console.log('All requests completed.');

      if (NR % 10 === 0) {
        console.log('--------clearing output----------------');
        clearTerminal();
        FS_ += 1;

        if (FS_ % 8640 === 0 && FS_ !== 0) {
          const MD_V = `Total requests made today: ${FS_}  ::${new Date().toISOString()}`;
          const notifPath = botDataPaths?.notificationsPath || notificationsPath;
          saveNotification(MD_V, botToken, chatId, notifPath);
          FS_ = 0;
        }
      }
    } catch (error) {
      console.error(`ERROR :::: ${error.message}`);
      const notifPath = botDataPaths?.notificationsPath || notificationsPath;
      saveNotification('ISSUE FOUND Restarting', botToken, chatId, notifPath);
    }
  }
};