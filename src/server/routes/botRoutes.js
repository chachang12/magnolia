import express from 'express';
import { botManager } from '../services/BotManager.js';
import { memoryMonitor } from '../services/MemoryMonitor.js';

const router = express.Router();

// Get all bots
router.get('/api/bots', (req, res) => {
  try {
    const bots = botManager.getAllBots();
    res.json({
      success: true,
      data: bots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific bot info
router.get('/api/bots/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const bot = botManager.getBotInfo(botId);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    res.json({
      success: true,
      data: bot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start a new bot
router.post('/api/bots', async (req, res) => {
  try {
    const { name, url, description, botToken, chatId } = req.body;
    
    // Validate required fields
    if (!name || !url || !botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: 'Name, URL, bot token, and chat ID are required'
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    // Basic validation for bot token format
    if (!botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bot token format'
      });
    }

    // Basic validation for chat ID format
    if (!chatId.match(/^-?\d+$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID format'
      });
    }

    const result = await botManager.startBot({
      name: name.trim(),
      url: url.trim(),
      description: description?.trim() || '',
      botToken: botToken.trim(),
      chatId: chatId.trim()
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Stop a bot
router.post('/api/bots/:botId/stop', async (req, res) => {
  try {
    const { botId } = req.params;
    const result = await botManager.stopBot(botId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Remove a bot
router.delete('/api/bots/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const result = await botManager.removeBot(botId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Get bot logs (memory)
router.get('/api/bots/:botId/logs', (req, res) => {
  try {
    const { botId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = botManager.getBotLogs(botId, limit);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get bot logs from disk (historical)
router.get('/api/bots/:botId/logs/history', (req, res) => {
  try {
    const { botId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const logs = botManager.getBotLogsFromDisk(botId, limit);
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get bot stats
router.get('/api/bots/:botId/stats', (req, res) => {
  try {
    const { botId } = req.params;
    const bot = botManager.getBotInfo(botId);
    
    if (!bot) {
      return res.status(404).json({
        success: false,
        error: 'Bot not found'
      });
    }

    res.json({
      success: true,
      data: {
        botId,
        stats: bot.stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get bot-specific data (data.json, ml_data.json, notifications.json)
router.get('/api/bots/:botId/data', (req, res) => {
  try {
    const { botId } = req.params;
    const { type } = req.query; // 'data', 'mlData', 'notifications', or 'all' (default)
    
    const data = botManager.getBotData(botId, type || 'all');
    
    res.json({
      success: true,
      data: {
        botId,
        ...data
      }
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Get all bots with their data
router.get('/api/bots/all-data', (req, res) => {
  try {
    const botsData = botManager.getAllBotsData();
    
    res.json({
      success: true,
      data: botsData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export bot-specific data in Label Studio format
router.get('/api/bots/:botId/export-labelstudio', (req, res) => {
  try {
    const { botId } = req.params;
    const botData = botManager.getBotData(botId, 'mlData');
    const mlData = botData.mlData || [];
    
    // Transform to Label Studio import format with absolute URLs
    const labelStudioData = mlData.map(item => {
      // Get the image path from the data
      const imagePath = item.data.image || item.imageUrl || '';
      
      // Create an absolute URL
      const absoluteImageUrl = imagePath.startsWith('http') 
        ? imagePath 
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
    
    const bot = botManager.getBotInfo(botId);
    const filename = `labelstudio_${bot?.name || botId}_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/json');
    res.json(labelStudioData);
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Get memory statistics
router.get('/api/system/memory', (req, res) => {
  try {
    const summary = memoryMonitor.getMemoryStatsSummary();
    const current = memoryMonitor.getMemoryUsage();
    const recommendations = memoryMonitor.getOptimizationRecommendations();
    
    res.json({
      success: true,
      data: {
        current,
        summary,
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force garbage collection
router.post('/api/system/gc', (req, res) => {
  try {
    const result = memoryMonitor.forceGarbageCollection();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
