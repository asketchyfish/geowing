import React from 'react';

const ScoreDisplay = ({ score, round, totalRounds }) => {
  return (
    <div className="fixed top-5 left-5 bg-white/90 p-4 rounded-lg shadow-lg z-50">
      <div className="text-base font-semibold">Round {round}/{totalRounds}</div>
      <div className="text-xl font-bold text-purple-600">{score} points</div>
    </div>
  );
};

export default ScoreDisplay; 