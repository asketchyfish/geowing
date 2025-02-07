import React, { useState } from 'react';
import StreetView from './components/StreetView';
import GuessMap from './components/GuessMap';
import ScoreDisplay from './components/ScoreDisplay';
import { calculateScore } from './utils/scoring';

const TOTAL_ROUNDS = 5;

const App = () => {
  const [gameState, setGameState] = useState({
    currentLocation: null,
    score: 0,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    isGameComplete: false
  });

  const handleGuess = (guessLocation) => {
    if (!gameState.currentLocation) return;
    
    const points = calculateScore(gameState.currentLocation, guessLocation);
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
    }));
  };

  const handleNextRound = () => {
    if (gameState.round === TOTAL_ROUNDS) {
      setGameState(prev => ({
        ...prev,
        isGameComplete: true
      }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentLocation: null,
      round: prev.round + 1,
    }));
  };

  const handleEndGame = () => {
    // Reset game
    setGameState({
      currentLocation: null,
      score: 0,
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      isGameComplete: false
    });
  };

  return (
    <div className="fixed inset-0 overflow-hidden m-0 p-0">
      {/* Street View Container */}
      <div className="absolute inset-0 z-0">
        <StreetView
          key={gameState.round}
          onReady={(location) => setGameState(prev => ({
            ...prev,
            currentLocation: location,
          }))}
        />
      </div>

      {/* UI Elements Container */}
      <div className="absolute inset-0 z-1 pointer-events-none">
        {/* Score Display */}
        <div className="absolute top-5 left-5 pointer-events-auto">
          <ScoreDisplay 
            score={gameState.score} 
            round={gameState.round}
            totalRounds={TOTAL_ROUNDS}
          />
        </div>

        {/* Guess Map */}
        <div className="absolute bottom-5 right-5 pointer-events-auto">
          <GuessMap 
            onGuess={handleGuess}
            onNextRound={handleNextRound}
            onEndGame={handleEndGame}
            disabled={!gameState.currentLocation}
            actualLocation={gameState.currentLocation}
            isLastRound={gameState.round === TOTAL_ROUNDS}
            isGameComplete={gameState.isGameComplete}
            finalScore={gameState.score}
          />
        </div>
      </div>
    </div>
  );
};

export default App; 