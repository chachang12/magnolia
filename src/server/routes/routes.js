import express from 'express';
import fs from 'fs';
import { notificationsPath, mlDataPath } from '../../shared/models.js';
import path from 'path';
import botRoutes from './botRoutes.js';

const router = express.Router();

// Include bot management routes
router.use(botRoutes);

// API endpoint to get all notifications
router.get('/api/notifications', (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get recent notifications
router.get('/api/notifications/recent', (req, res) => {
  try {
    const notifications = JSON.parse(fs.readFileSync(notificationsPath, 'utf-8'));
    res.json(notifications.slice(-10).reverse()); // Last 10 notifications
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to access ML data
router.get('/api/ml-data', (req, res) => {
  try {
    const mlData = JSON.parse(fs.readFileSync(mlDataPath, 'utf-8'));
    res.json(mlData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Export ML data in Label Studio format
router.get('/api/export-labelstudio', (req, res) => {
  try {
    const mlData = JSON.parse(fs.readFileSync(mlDataPath, 'utf-8'));
    
    // Transform to Label Studio import format with absolute URLs
    const labelStudioData = mlData.map(item => {
      // Get the image path from the data
      const imagePath = item.data.image || item.imageUrl || '';
      
      // Create an absolute URL
      const absoluteImageUrl = imagePath.startsWith('http') 
        ? imagePath 
        // : `${req.protocol}://${req.get('host')}${imagePath}`;
        : `${req.protocol}://${req.get('host')}${imagePath}`;
      
      return {
        id: item.id,
        data: {
          image: absoluteImageUrl,
          title: item.title || item.data.title,
          price: item.price || item.data.price,
          url: item.url || item.data.url,
          description: item.data.description || `Condition: ${item.details?.condition}\nShipping: ${item.details?.shipping}\nSeller: ${item.details?.seller}\nLocation: ${item.details?.location}`,
        },
        annotations: item.annotations || []
      };
    });
    
    // Log a sample URL to confirm format
    if (labelStudioData.length > 0) {
      console.log('Sample image URL:', labelStudioData[0].data.image);
    }
    
    res.setHeader('Content-Disposition', 'attachment; filename=labelstudio_data.json');
    res.setHeader('Content-Type', 'application/json');
    res.json(labelStudioData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;