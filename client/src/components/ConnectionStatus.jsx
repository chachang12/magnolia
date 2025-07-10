import React from 'react';

const ConnectionStatus = ({ connected }) => {
  return (
    <div className={`connection-status ${connected ? 'connection-connected' : 'connection-disconnected'}`}>
      {connected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
};

export default ConnectionStatus;
