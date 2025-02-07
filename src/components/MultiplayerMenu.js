import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

const MultiplayerMenu = () => {
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const { ws, error, isConnecting } = useWebSocket();
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (!ws) {
      console.error('No WebSocket connection available');
      return;
    }
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending CREATE_ROOM request');
      ws.send(JSON.stringify({ type: 'CREATE_ROOM' }));
    } else {
      console.error('WebSocket not in OPEN state:', ws.readyState);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      return;
    }
    if (!ws) {
      return;
    }
    if (ws.readyState === WebSocket.OPEN) {
      console.log('Sending JOIN_ROOM');
      ws.send(JSON.stringify({ 
        type: 'JOIN_ROOM',
        roomId: roomId.trim()
      }));
    }
  };

  const handleStartSinglePlayer = () => {
    navigate('/single-player');
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose Game Mode</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {isConnecting ? (
          <div className="text-gray-600">Connecting to server...</div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleStartSinglePlayer}
              className="w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg
                hover:bg-purple-600 transition-colors"
              disabled={isConnecting}
            >
              Single Player
            </button>

            <button
              onClick={handleCreateRoom}
              className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg
                hover:bg-green-600 transition-colors"
              disabled={isConnecting}
            >
              Create Multiplayer Room
            </button>

            <button
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg
                hover:bg-blue-600 transition-colors"
              disabled={isConnecting}
            >
              Join Room
            </button>

            {showJoinForm && (
              <form onSubmit={handleJoinRoom} className="mt-4">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter Room ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                  disabled={isConnecting}
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg
                    hover:bg-blue-600 transition-colors"
                  disabled={isConnecting}
                >
                  Join
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerMenu; 