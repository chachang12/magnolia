import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

const mlDataPath = path.join(projectRoot, 'data', 'ml_data.json');
const imagesDir = path.join(projectRoot, 'public', 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function downloadImage(url, filename) {
  const imagePath = path.join(imagesDir, filename);
  
  // Check if image already exists
  if (fs.existsSync(imagePath)) {
    console.log(`Image ${filename} already exists, skipping download`);
    return `/images/${filename}`;
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/images/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}: ${error.message}`);
    return null;
  }
}

async function processData() {
  // Read the ml_data.json file
  const mlData = JSON.parse(fs.readFileSync(mlDataPath, 'utf-8'));
  let modified = false;
  
  // Process each item
  for (let i = 0; i < mlData.length; i++) {
    const item = mlData[i];
    
    // Generate a filename based on the item ID
    const imageUrl = item.imageUrl || item.data?.image;
    if (!imageUrl) continue;
    
    const extension = path.extname(imageUrl) || '.webp';
    const filename = `${item.id}${extension}`;
    
    console.log(`Processing item ${i+1}/${mlData.length}: ${item.id}`);
    
    // Download the image and get the local path
    const localPath = await downloadImage(imageUrl, filename);
    
    if (localPath) {
      // Update the image URLs in the item
      if (item.imageUrl) {
        item.imageUrl = localPath;
        modified = true;
      }
      
      if (item.data && item.data.image) {
        item.data.image = localPath;
        modified = true;
      }
    }
  }
  
  // Save the updated data
  if (modified) {
    fs.writeFileSync(mlDataPath, JSON.stringify(mlData, null, 2), 'utf-8');
    console.log('Updated ml_data.json with local image paths');
  }
}

processData().catch(error => {
  console.error('Error processing data:', error);
});