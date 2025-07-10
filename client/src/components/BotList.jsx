import React from 'react';

const BotList = ({ bots, loading, onStopBot, onRemoveBot }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-800 p-6 bg-gray-50 border-b border-gray-200">
          Your Bots
        </h2>
        <div className="text-center py-10">
          <p className="text-gray-600">Loading bots...</p>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-800 p-6 bg-gray-50 border-b border-gray-200">
          Your Bots
        </h2>
        <div className="text-center py-16 px-8">
          <h3 className="text-xl font-medium text-gray-800 mb-3">No bots created yet</h3>
          <p className="text-gray-600">Create your first bot using the form above to start scraping eBay listings.</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'running':
        return 'status-running';
      case 'stopped':
        return 'status-stopped';
      case 'starting':
        return 'status-starting';
      case 'error':
        return 'status-error';
      default:
        return 'status-stopped';
    }
  };

  const downloadBotData = async (botId, botName, dataType = 'labelstudio') => {
    try {
      const response = await fetch(`/api/bots/${botId}/export-labelstudio`);
      
      if (!response.ok) {
        throw new Error('Failed to download bot data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${botName}_${dataType}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading bot data:', error);
      alert('Failed to download bot data. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <h2 className="text-2xl font-semibold text-gray-800 p-6 bg-gray-50 border-b border-gray-200">
        Your Bots ({bots.length})
      </h2>
      
      {bots.map(bot => (
        <div key={bot.id} className="p-8 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{bot.name}</h3>
            <span className={`status-badge ${getStatusClass(bot.status)}`}>
              {bot.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Bot Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">ID:</span> <span className="text-gray-600">{bot.id}</span></p>
                <p><span className="font-medium text-gray-700">Created:</span> <span className="text-gray-600">{formatDate(bot.createdAt)}</span></p>
                <p><span className="font-medium text-gray-700">URL:</span> <a href={bot.url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:text-primary-600 break-all hover:underline">{bot.url}</a></p>
                {bot.description && <p><span className="font-medium text-gray-700">Description:</span> <span className="text-gray-600">{bot.description}</span></p>}
                {bot.botToken && <p><span className="font-medium text-gray-700">Bot Token:</span> <span className="text-gray-600 font-mono">{bot.botToken}</span></p>}
                {bot.chatId && <p><span className="font-medium text-gray-700">Chat ID:</span> <span className="text-gray-600 font-mono">{bot.chatId}</span></p>}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Runtime Information
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium text-gray-700">Started:</span> <span className="text-gray-600">{formatDate(bot.startedAt)}</span></p>
                <p><span className="font-medium text-gray-700">Stopped:</span> <span className="text-gray-600">{formatDate(bot.stoppedAt)}</span></p>
                <p><span className="font-medium text-gray-700">Last Activity:</span> <span className="text-gray-600">{formatDate(bot.stats?.lastActivity)}</span></p>
              </div>
            </div>
          </div>

          {bot.stats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold text-primary-500">{bot.stats.itemsFound || 0}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Items Found</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold text-primary-500">{bot.stats.requestsCompleted || 0}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Requests</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-semibold text-primary-500">{bot.stats.errors || 0}</div>
                <div className="text-sm text-gray-600 uppercase tracking-wide">Errors</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap mb-4">
            {bot.status === 'running' && (
              <button 
                className="btn btn-warning"
                onClick={() => onStopBot(bot.id)}
              >
                Stop Bot
              </button>
            )}
            
            {bot.status !== 'running' && (
              <button 
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove "${bot.name}"?`)) {
                    onRemoveBot(bot.id);
                  }
                }}
              >
                Remove Bot
              </button>
            )}
            
            <button 
              className="btn-primary"
              onClick={() => downloadBotData(bot.id, bot.name)}
              style={{
                backgroundColor: '#667eea',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Download Data
            </button>
          </div>

          {bot.recentLogs && bot.recentLogs.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Recent Activity
              </h4>
              <div className="max-h-24 overflow-y-auto text-sm space-y-2">
                {bot.recentLogs.slice(-3).map((log, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`text-xs ${log.level === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                      {log.message.substring(0, 100)}...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BotList;
