import React from 'react';

const ScoreDisplay = ({ gameState, playerId }) => {
  if (!gameState) return null;

  return (
    <div className="score-display">
      <h2>Scores</h2>
      <div className="players-list">
        {gameState.players.map(player => (
          <div 
            key={player.id} 
            className={`player ${player.id === playerId ? 'current-player' : ''}`}
          >
            <span>{player.id}</span>
            <span>{player.score} points</span>
            {player.hasGuessed && <span>(Guessed)</span>}
          </div>
        ))}
      </div>
      {gameState.timer <= 0 && (
        <button 
          onClick={() => ws.send(JSON.stringify({ type: 'START_GAME' }))}
        >
          Start Next Round
        </button>
      )}
    </div>
  );
};

export default ScoreDisplay; 