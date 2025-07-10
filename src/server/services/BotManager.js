import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../');

class BotManager extends EventEmitter {
  constructor() {
    super();
    this.bots = new Map(); // Store active bots
    this.botConfigPath = path.join(projectRoot, './data/bot_configs.json');
    this.botStatsPath = path.join(projectRoot, './data/bot_stats.json');
    this.maxLogEntries = 50; // Reduced from 100 - Maximum log entries per bot in memory
    this.logRotationInterval = 30000; // Rotate logs every 30 seconds instead of 60
    this.memoryCleanupInterval = 120000; // Clean up memory every 2 minutes instead of 5
    this.maxLogFileSize = 10 * 1024 * 1024; // 10MB max log file size
    this.initializeBotFiles();
    this.startPeriodicTasks();
  }

  initializeBotFiles() {
    // Initialize bot configurations file
    if (!fs.existsSync(this.botConfigPath)) {
      fs.writeFileSync(this.botConfigPath, JSON.stringify([], null, 4), 'utf-8');
    }

    // Initialize bot stats file
    if (!fs.existsSync(this.botStatsPath)) {
      fs.writeFileSync(this.botStatsPath, JSON.stringify({}, null, 4), 'utf-8');
    }
  }

  generateBotId() {
    return `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async startBot(config) {
    const { name, url, description = '', botToken, chatId } = config;
    
    if (!name || !url || !botToken || !chatId) {
      throw new Error('Bot name, URL, bot token, and chat ID are required');
    }

    // Check if bot with same name already exists
    const existingBot = Array.from(this.bots.values()).find(bot => bot.name === name);
    if (existingBot) {
      throw new Error(`Bot with name "${name}" already exists`);
    }

    const botId = this.generateBotId();
    const botConfig = {
      id: botId,
      name,
      url,
      description,
      botToken,
      chatId,
      createdAt: new Date().toISOString(),
      status: 'starting'
    };

    try {
      // Create bot-specific data directory
      const botDataDir = path.join(projectRoot, 'data', 'bots', botId);
      if (!fs.existsSync(botDataDir)) {
        fs.mkdirSync(botDataDir, { recursive: true });
      }

      // Initialize bot-specific data files
      const botDataPaths = {
        dataPath: path.join(botDataDir, 'data.json'),
        mlDataPath: path.join(botDataDir, 'ml_data.json'),
        notificationsPath: path.join(botDataDir, 'notifications.json')
      };

      // Create initial data files
      if (!fs.existsSync(botDataPaths.dataPath)) {
        fs.writeFileSync(botDataPaths.dataPath, JSON.stringify({}, null, 4), 'utf-8');
      }
      if (!fs.existsSync(botDataPaths.mlDataPath)) {
        fs.writeFileSync(botDataPaths.mlDataPath, JSON.stringify([], null, 4), 'utf-8');
      }
      if (!fs.existsSync(botDataPaths.notificationsPath)) {
        fs.writeFileSync(botDataPaths.notificationsPath, JSON.stringify([], null, 4), 'utf-8');
      }

      // Spawn the scraper process with bot token, chat ID, and bot ID as arguments
      const scraperProcess = spawn('node', [
        'scraper-only.js', 
        url,
        '--bot-token',
        botToken,
        '--chat-id', 
        chatId,
        '--bot-id',
        botId
      ], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      // Create bot object
      const bot = {
        ...botConfig,
        process: scraperProcess,
        logs: [],
        botDataDir,
        botDataPaths,
        stats: {
          itemsFound: 0,
          requestsCompleted: 0,
          errors: 0,
          lastActivity: new Date().toISOString()
        }
      };

      // Store bot
      this.bots.set(botId, bot);

      // Set up process event handlers
      scraperProcess.stdout.on('data', (data) => {
        const message = data.toString();
        this.handleBotLog(botId, message, 'info');
      });

      scraperProcess.stderr.on('data', (data) => {
        const message = data.toString();
        this.handleBotLog(botId, message, 'error');
      });

      scraperProcess.on('close', (code) => {
        this.handleBotStop(botId, code);
      });

      scraperProcess.on('error', (error) => {
        this.handleBotError(botId, error);
      });

      // Update bot status
      bot.status = 'running';
      bot.startedAt = new Date().toISOString();

      // Save bot configuration
      await this.saveBotConfig(botConfig);

      // Emit bot started event
      this.emit('botStarted', { botId, bot: this.getBotInfo(botId) });

      console.log(`Bot "${name}" started with ID: ${botId}`);
      return { botId, status: 'started' };

    } catch (error) {
      // Clean up if bot failed to start
      this.bots.delete(botId);
      throw new Error(`Failed to start bot: ${error.message}`);
    }
  }

  async stopBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    try {
      // Kill the process
      if (bot.process && !bot.process.killed) {
        bot.process.kill('SIGTERM');
        
        // Force kill after 5 seconds if still running
        setTimeout(() => {
          if (bot.process && !bot.process.killed) {
            bot.process.kill('SIGKILL');
          }
        }, 5000);
      }

      // Update bot status
      bot.status = 'stopped';
      bot.stoppedAt = new Date().toISOString();

      // Emit bot stopped event
      this.emit('botStopped', { botId, bot: this.getBotInfo(botId) });

      console.log(`Bot "${bot.name}" stopped`);
      return { botId, status: 'stopped' };

    } catch (error) {
      throw new Error(`Failed to stop bot: ${error.message}`);
    }
  }

  async removeBot(botId) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    // Stop the bot first if it's running
    if (bot.status === 'running') {
      await this.stopBot(botId);
    }

    // Remove from memory
    this.bots.delete(botId);

    // Remove from saved configs
    await this.removeBotConfig(botId);

    // Emit bot removed event
    this.emit('botRemoved', { botId });

    console.log(`Bot "${bot.name}" removed`);
    return { botId, status: 'removed' };
  }

  getBotInfo(botId) {
    const bot = this.bots.get(botId);
    if (!bot) {
      return null;
    }

    return {
      id: bot.id,
      name: bot.name,
      url: bot.url,
      description: bot.description,
      botToken: bot.botToken ? '***' + bot.botToken.slice(-8) : undefined, // Hide most of the token
      chatId: bot.chatId,
      status: bot.status,
      createdAt: bot.createdAt,
      startedAt: bot.startedAt,
      stoppedAt: bot.stoppedAt,
      stats: bot.stats,
      recentLogs: bot.logs.slice(-10) // Last 10 logs
    };
  }

  getAllBots() {
    const bots = [];
    for (const [botId, bot] of this.bots) {
      bots.push(this.getBotInfo(botId));
    }
    return bots;
  }

  getBotLogs(botId, limit = 50) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    return bot.logs.slice(-limit);
  }

  getBotLogsFromDisk(botId, limit = 100) {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }

    try {
      const logFilePath = path.join(bot.botDataDir, 'logs.json');
      if (fs.existsSync(logFilePath)) {
        const diskLogs = JSON.parse(fs.readFileSync(logFilePath, 'utf-8'));
        return diskLogs.slice(-limit);
      }
      return [];
    } catch (error) {
      console.error(`Error reading logs from disk for bot ${botId}:`, error);
      return [];
    }
  }

  handleBotLog(botId, message, level = 'info') {
    const bot = this.bots.get(botId);
    if (!bot) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: message.trim()
    };

    // Add to bot logs (keep last maxLogEntries)
    bot.logs.push(logEntry);
    if (bot.logs.length > this.maxLogEntries) {
      bot.logs = bot.logs.slice(-this.maxLogEntries);
    }

    // Update stats based on log content
    if (message.includes('NEW PRODUCT FOUND')) {
      bot.stats.itemsFound++;
    }
    if (message.includes('All requests completed')) {
      bot.stats.requestsCompleted++;
    }
    if (level === 'error') {
      bot.stats.errors++;
    }

    bot.stats.lastActivity = new Date().toISOString();

    // Emit log event
    this.emit('botLog', { botId, log: logEntry });
  }

  handleBotStop(botId, exitCode) {
    const bot = this.bots.get(botId);
    if (!bot) return;

    bot.status = exitCode === 0 ? 'stopped' : 'crashed';
    bot.stoppedAt = new Date().toISOString();

    // Save final stats to disk when bot stops
    this.saveBotStatsToFile(botId);

    this.emit('botStopped', { botId, bot: this.getBotInfo(botId), exitCode });
  }

  handleBotError(botId, error) {
    const bot = this.bots.get(botId);
    if (!bot) return;

    bot.status = 'error';
    this.handleBotLog(botId, `Process error: ${error.message}`, 'error');

    this.emit('botError', { botId, error: error.message });
  }

  async saveBotConfig(config) {
    try {
      const configs = JSON.parse(fs.readFileSync(this.botConfigPath, 'utf-8'));
      configs.push(config);
      fs.writeFileSync(this.botConfigPath, JSON.stringify(configs, null, 4), 'utf-8');
    } catch (error) {
      console.error('Error saving bot config:', error);
    }
  }

  async removeBotConfig(botId) {
    try {
      const configs = JSON.parse(fs.readFileSync(this.botConfigPath, 'utf-8'));
      const updatedConfigs = configs.filter(config => config.id !== botId);
      fs.writeFileSync(this.botConfigPath, JSON.stringify(updatedConfigs, null, 4), 'utf-8');
    } catch (error) {
      console.error('Error removing bot config:', error);
    }
  }

  getBotData(botId, dataType = 'all') {
    const bot = this.bots.get(botId);
    if (!bot || !bot.botDataPaths) {
      throw new Error(`Bot with ID ${botId} not found or has no data paths`);
    }

    try {
      const result = {};
      
      if (dataType === 'all' || dataType === 'data') {
        result.data = JSON.parse(fs.readFileSync(bot.botDataPaths.dataPath, 'utf-8'));
      }
      
      if (dataType === 'all' || dataType === 'mlData') {
        result.mlData = JSON.parse(fs.readFileSync(bot.botDataPaths.mlDataPath, 'utf-8'));
      }
      
      if (dataType === 'all' || dataType === 'notifications') {
        result.notifications = JSON.parse(fs.readFileSync(bot.botDataPaths.notificationsPath, 'utf-8'));
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to read bot data: ${error.message}`);
    }
  }

  getAllBotsData() {
    const botsData = {};
    
    for (const [botId, bot] of this.bots) {
      try {
        botsData[botId] = {
          ...this.getBotInfo(botId),
          data: this.getBotData(botId)
        };
      } catch (error) {
        console.error(`Error reading data for bot ${botId}:`, error);
        botsData[botId] = {
          ...this.getBotInfo(botId),
          data: null,
          error: error.message
        };
      }
    }
    
    return botsData;
  }

  startPeriodicTasks() {
    // Periodic memory cleanup
    this.memoryCleanupTimer = setInterval(() => {
      this.performMemoryCleanup();
    }, this.memoryCleanupInterval);

    // Periodic log rotation
    this.logRotationTimer = setInterval(() => {
      this.performLogRotation();
    }, this.logRotationInterval);
  }

  performMemoryCleanup() {
    console.log('Performing memory cleanup for bot manager...');
    
    for (const [botId, bot] of this.bots) {
      // Trim logs to prevent unbounded growth
      if (bot.logs.length > this.maxLogEntries) {
        bot.logs = bot.logs.slice(-this.maxLogEntries);
      }
      
      // Clean up old stats if needed
      if (bot.stats.lastActivity) {
        const lastActivity = new Date(bot.stats.lastActivity);
        const now = new Date();
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        // If bot has been inactive for over 24 hours, reduce log retention
        if (hoursSinceActivity > 24 && bot.logs.length > 50) {
          bot.logs = bot.logs.slice(-50);
        }
      }
    }
    
    // Save stats to disk
    this.saveAllBotStatsToFile();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  performLogRotation() {
    // Write recent logs to disk for each bot
    for (const [botId, bot] of this.bots) {
      try {
        const logFilePath = path.join(bot.botDataDir, 'logs.json');
        const existingLogs = fs.existsSync(logFilePath) 
          ? JSON.parse(fs.readFileSync(logFilePath, 'utf-8'))
          : [];
        
        // Add new logs since last rotation
        const newLogs = bot.logs.filter(log => {
          const logTime = new Date(log.timestamp);
          const rotationTime = new Date(Date.now() - this.logRotationInterval);
          return logTime > rotationTime;
        });
        
        if (newLogs.length > 0) {
          // Append new logs and keep only last 1000 entries on disk
          const allLogs = [...existingLogs, ...newLogs];
          const trimmedLogs = allLogs.slice(-1000);
          
          fs.writeFileSync(logFilePath, JSON.stringify(trimmedLogs, null, 2), 'utf-8');
        }
      } catch (error) {
        console.error(`Error rotating logs for bot ${botId}:`, error);
      }
    }
  }

  saveAllBotStatsToFile() {
    try {
      const allStats = {};
      for (const [botId, bot] of this.bots) {
        allStats[botId] = {
          ...bot.stats,
          lastSavedAt: new Date().toISOString()
        };
        
        // Also save stats to individual bot directory
        if (bot.botDataDir) {
          const botStatsPath = path.join(bot.botDataDir, 'stats.json');
          fs.writeFileSync(botStatsPath, JSON.stringify(bot.stats, null, 4), 'utf-8');
        }
      }
      fs.writeFileSync(this.botStatsPath, JSON.stringify(allStats, null, 4), 'utf-8');
    } catch (error) {
      console.error('Error saving bot stats to file:', error);
    }
  }

  saveBotStatsToFile(botId) {
    try {
      const bot = this.bots.get(botId);
      if (!bot) return;
      
      if (bot.botDataDir) {
        const botStatsPath = path.join(bot.botDataDir, 'stats.json');
        fs.writeFileSync(botStatsPath, JSON.stringify(bot.stats, null, 4), 'utf-8');
      }
    } catch (error) {
      console.error(`Error saving stats for bot ${botId}:`, error);
    }
  }

  // Clean up all bots on shutdown
  async shutdown() {
    console.log('Shutting down bot manager...');
    
    // Save all stats before shutdown
    this.saveAllBotStatsToFile();
    
    // Clear periodic tasks
    if (this.memoryCleanupTimer) {
      clearInterval(this.memoryCleanupTimer);
    }
    if (this.logRotationTimer) {
      clearInterval(this.logRotationTimer);
    }
    
    for (const [botId, bot] of this.bots) {
      if (bot.status === 'running') {
        try {
          await this.stopBot(botId);
        } catch (error) {
          console.error(`Error stopping bot ${botId}:`, error);
        }
      }
    }
    
    this.bots.clear();
    console.log('Bot manager shutdown complete');
  }
}

// Create singleton instance
export const botManager = new BotManager();
export default BotManager;
