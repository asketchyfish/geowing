import React, { useState } from 'react';

const LobbyScreen = ({ gameState, roomId, isCreator, onStartGame, playerId, onRename }) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onRename(newName.trim());
      setEditingName(false);
      setNewName('');
    }
  };

  if (!gameState) {
    return (
      <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <div className="text-gray-600">Loading game state...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Game Lobby</h2>
        
        {/* Room Code Section */}
        <div className="mb-8">
          <div className="text-gray-600 mb-2">Room Code:</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl font-mono font-bold text-purple-600">{roomId}</span>
            <button 
              onClick={copyToClipboard}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Players List */}
        <div className="mb-8">
          <div className="text-gray-600 mb-2">
            Players ({gameState?.players?.length || 0}):
          </div>
          <div className="space-y-2">
            {(gameState?.players || []).map(player => (
              <div 
                key={player.id}
                className={`bg-gray-50 py-2 px-4 rounded-lg font-semibold 
                  ${player.id === playerId ? 'border-2 border-purple-300' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {player.name || `Player ${player.id.slice(0, 4)}`}
                    {player.id === playerId && ' (You)'}
                    {player.isHost && ' (Host)'}
                  </span>
                  {player.id === playerId && !editingName && (
                    <button
                      onClick={() => setEditingName(true)}
                      className="text-sm text-purple-500 hover:text-purple-600"
                    >
                      Rename
                    </button>
                  )}
                </div>
                {player.id === playerId && editingName && (
                  <form onSubmit={handleRename} className="mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter your name"
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingName(false)}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Button (only for creator) */}
        {isCreator && (
          <button
            onClick={onStartGame}
            className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg
              hover:bg-green-600 transition-colors"
          >
            Start Game
          </button>
        )}
        
        {!isCreator && (
          <div className="text-gray-500 italic">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen; 