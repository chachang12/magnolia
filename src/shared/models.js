import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

// Define file paths
export const filePath = path.join(projectRoot, './data/data.json');
export const mlDataPath = path.join(projectRoot, './data/ml_data.json');
export const notificationsPath = path.join(projectRoot, './data/notifications.json');

// Initialize files if they don't exist
export const initializeFiles = () => {
  if (!fs.existsSync(notificationsPath)) {
    fs.writeFileSync(notificationsPath, JSON.stringify([], null, 4), 'utf-8');
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 4), 'utf-8');
  }

  if (!fs.existsSync(mlDataPath)) {
    fs.writeFileSync(mlDataPath, JSON.stringify([], null, 4), 'utf-8');
  }
};

// HTTP request headers
export const headers = {
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

// Define listing model structure (for consistency across the app)
export const createListingModel = (itemId, cleanItemUrl, title, price, image, condition, seller, location, shipping, priceDetails = {}) => {
  return {
    id: itemId,
    url: cleanItemUrl,
    title: title,
    price: price,
    imageUrl: image,
    foundAt: new Date().toISOString(),
    details: {
      condition: condition,
      seller: seller,
      location: location,
      shipping: shipping,
      priceDetails: {
        rawPrice: priceDetails.rawPrice || '',
        offerType: priceDetails.offerType || '',
        isAuction: priceDetails.isAuction || false,
        shipping: priceDetails.shipping || ''
      }
    },
    // These fields are used by Label Studio
    data: {
      image: image,
      title: title,
      price: price,
      url: cleanItemUrl,
      description: `Condition: ${condition}\nShipping: ${shipping}\nSeller: ${seller}\nLocation: ${location}`,
      metadata: {
        foundAt: new Date().toISOString(),
        itemId: itemId
      }
    },
    annotations: [],
    predictions: []
  };
};