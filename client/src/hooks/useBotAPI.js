export const useBotAPI = () => {
  const API_BASE = '/api';

  const apiCall = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  };

  const getAllBots = async () => {
    const response = await apiCall('/bots');
    return response.data;
  };

  const getBot = async (botId) => {
    const response = await apiCall(`/bots/${botId}`);
    return response.data;
  };

  const createBot = async (botData) => {
    const response = await apiCall('/bots', {
      method: 'POST',
      body: JSON.stringify(botData)
    });
    return response;
  };

  const stopBot = async (botId) => {
    const response = await apiCall(`/bots/${botId}/stop`, {
      method: 'POST'
    });
    return response;
  };

  const removeBot = async (botId) => {
    const response = await apiCall(`/bots/${botId}`, {
      method: 'DELETE'
    });
    return response;
  };

  const getBotLogs = async (botId, limit = 50) => {
    const response = await apiCall(`/bots/${botId}/logs?limit=${limit}`);
    return response.data;
  };

  const getBotStats = async (botId) => {
    const response = await apiCall(`/bots/${botId}/stats`);
    return response.data;
  };

  return {
    getAllBots,
    getBot,
    createBot,
    stopBot,
    removeBot,
    getBotLogs,
    getBotStats
  };
};
