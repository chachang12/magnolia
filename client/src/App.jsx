import React, { useState, useEffect } from 'react';
import BotForm from './components/BotForm';
import BotList from './components/BotList';
import ConnectionStatus from './components/ConnectionStatus';
import { useWebSocket } from './hooks/useWebSocket';
import { useBotAPI } from './hooks/useBotAPI';

function App() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { connected, lastMessage } = useWebSocket('ws://localhost:4000');
  const { getAllBots, createBot, stopBot, removeBot } = useBotAPI();

  // Load initial bots
  useEffect(() => {
    loadBots();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage);
      
      switch (message.type) {
        case 'INITIAL_STATE':
          setBots(message.data.bots);
          setLoading(false);
          break;
          
        case 'BOT_STARTED':
          setBots(prev => [...prev, message.data.bot]);
          setSuccess(`Bot "${message.data.bot.name}" started successfully`);
          setTimeout(() => setSuccess(null), 3000);
          break;
          
        case 'BOT_STOPPED':
          setBots(prev => prev.map(bot => 
            bot.id === message.data.botId 
              ? { ...bot, ...message.data.bot }
              : bot
          ));
          break;
          
        case 'BOT_REMOVED':
          setBots(prev => prev.filter(bot => bot.id !== message.data.botId));
          break;
          
        case 'BOT_LOG':
          setBots(prev => prev.map(bot => 
            bot.id === message.data.botId 
              ? { 
                  ...bot, 
                  recentLogs: [...(bot.recentLogs || []), message.data.log].slice(-10),
                  stats: {
                    ...bot.stats,
                    lastActivity: message.data.log.timestamp
                  }
                }
              : bot
          ));
          break;
          
        case 'BOT_ERROR':
          setBots(prev => prev.map(bot => 
            bot.id === message.data.botId 
              ? { ...bot, status: 'error' }
              : bot
          ));
          setError(`Bot error: ${message.data.error}`);
          setTimeout(() => setError(null), 5000);
          break;
          
        default:
          break;
      }
    }
  }, [lastMessage]);

  const loadBots = async () => {
    try {
      setLoading(true);
      const botsData = await getAllBots();
      setBots(botsData);
    } catch (err) {
      setError('Failed to load bots');
      console.error('Error loading bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async (botData) => {
    try {
      setError(null);
      const result = await createBot(botData);
      
      if (result.success) {
        setSuccess(`Bot "${botData.name}" is starting...`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to create bot');
      }
    } catch (err) {
      setError('Failed to create bot: ' + err.message);
    }
  };

  const handleStopBot = async (botId) => {
    try {
      setError(null);
      const result = await stopBot(botId);
      
      if (result.success) {
        const bot = bots.find(b => b.id === botId);
        setSuccess(`Bot "${bot?.name}" is stopping...`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to stop bot');
      }
    } catch (err) {
      setError('Failed to stop bot: ' + err.message);
    }
  };

  const handleRemoveBot = async (botId) => {
    try {
      setError(null);
      const result = await removeBot(botId);
      
      if (result.success) {
        const bot = bots.find(b => b.id === botId);
        setSuccess(`Bot "${bot?.name}" removed successfully`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to remove bot');
      }
    } catch (err) {
      setError('Failed to remove bot: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-5">
      <ConnectionStatus connected={connected} />
      
      <div className="bg-black text-white py-12 px-8 mb-8 rounded-xl shadow-xl">
        <h1 className="text-4xl font-light text-center mb-3">Bot Management Dashboard</h1>
        <p className="text-center opacity-90">Holy shit can we get some revenue going?</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-5">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-5">
          {success}
        </div>
      )}

      <BotForm onSubmit={handleCreateBot} />

      <BotList
        bots={bots}
        loading={loading}
        onStopBot={handleStopBot}
        onRemoveBot={handleRemoveBot}
      />
      <h6 className="text-center text-gray-500 mt-10">
        Carson Chang | 2025
      </h6>
    </div>
  );
}

export default App;
