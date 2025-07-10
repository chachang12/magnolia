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
  exec('clear', (error, stdout, stderr) => {
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

const saveNotification = async (message) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    notifications.push({
      message,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(notificationsPath, JSON.stringify(notifications, null, 4), 'utf-8');
    console.log(`Notification saved: ${message.substring(0, 50)}...`);
  } catch (error) {
    console.error(`Error saving notification: ${error.message}`);
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

const scrapeData = async (url) => {
  try {
    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);
    const items = $('ul.srp-results.srp-grid.clearfix li[data-viewport], li.s-item.s-item__pl-on-bottom[id]');
    const temp = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const mlData = JSON.parse(fs.readFileSync(mlDataPath, 'utf-8'));
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
          saveNotification(value);
          
          // Add to ML dataset
          mlData.push(listingModel);
          newItemsAdded = true;
          
          // Update tracking file (existing behavior)
          fs.writeFileSync(filePath, JSON.stringify(temp, null, 4), 'utf-8');
        }
      }
    });
    
    // Only write to ML data file if new items were added
    if (newItemsAdded) {
      fs.writeFileSync(mlDataPath, JSON.stringify(mlData, null, 4), 'utf-8');
      console.log(`ML data updated with new items. Total items: ${mlData.length}`);
    }
    
  } catch (error) {
    console.error(`Error scraping data: ${error.message}`);
  }
};

export const startScraper = async (url) => {
  if (!url) {
    console.error('Error: No URL provided. Please provide a URL as a command line argument.');
    process.exit(1);
  }

  console.log(`Starting scraper with URL: ${url}`);
  
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
          saveNotification(MD_V);
          FS_ = 0;
        }
      }
    } catch (error) {
      console.error(`ERROR :::: ${error.message}`);
      saveNotification('ISSUE FOUND Restarting');
    }
  }
};