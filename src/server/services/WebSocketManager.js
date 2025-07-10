import { WebSocketServer } from 'ws';
import { botManager } from './BotManager.js';

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Set();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });
    
    this.wss.on('connection', (ws) => {
      console.log('Client connected to WebSocket');
      this.clients.add(ws);

      // Send initial bot status
      this.sendToClient(ws, {
        type: 'INITIAL_STATE',
        data: {
          bots: botManager.getAllBots()
        }
      });

      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Listen to bot manager events
    this.setupBotManagerListeners();
  }

  setupBotManagerListeners() {
    botManager.on('botStarted', (data) => {
      this.broadcast({
        type: 'BOT_STARTED',
        data
      });
    });

    botManager.on('botStopped', (data) => {
      this.broadcast({
        type: 'BOT_STOPPED',
        data
      });
    });

    botManager.on('botRemoved', (data) => {
      this.broadcast({
        type: 'BOT_REMOVED',
        data
      });
    });

    botManager.on('botLog', (data) => {
      this.broadcast({
        type: 'BOT_LOG',
        data
      });
    });

    botManager.on('botError', (data) => {
      this.broadcast({
        type: 'BOT_ERROR',
        data
      });
    });
  }

  handleClientMessage(ws, message) {
    const { type, data } = message;

    switch (type) {
      case 'PING':
        this.sendToClient(ws, { type: 'PONG' });
        break;

      case 'GET_BOTS':
        this.sendToClient(ws, {
          type: 'BOTS_DATA',
          data: {
            bots: botManager.getAllBots()
          }
        });
        break;

      case 'GET_BOT_LOGS':
        try {
          const logs = botManager.getBotLogs(data.botId, data.limit || 50);
          this.sendToClient(ws, {
            type: 'BOT_LOGS',
            data: {
              botId: data.botId,
              logs
            }
          });
        } catch (error) {
          this.sendToClient(ws, {
            type: 'ERROR',
            data: {
              message: error.message
            }
          });
        }
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  }

  sendToClient(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Clean up on shutdown
  shutdown() {
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
  }
}

export const wsManager = new WebSocketManager();
export default WebSocketManager;
