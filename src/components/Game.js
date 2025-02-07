import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import StreetView from './StreetView';
import GuessMap from './GuessMap';
import ScoreDisplay from './ScoreDisplay';
import RoundResults from './RoundResults';
import RoomIdDisplay from './RoomIdDisplay';
import LobbyScreen from './LobbyScreen';
import { calculateScore } from '../utils/scoring';
import { useWebSocket } from '../hooks/useWebSocket';

const TOTAL_ROUNDS = 5;

const Game = ({ mode }) => {
  const { roomId } = useParams();
  const { ws, error: wsError, isConnecting } = useWebSocket(mode === 'multiplayer');
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const [isCreator, setIsCreator] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [guessLocation, setGuessLocation] = useState(null);
  const [roundScore, setRoundScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    if (!ws) return;

    // Load initial state from session storage
    const savedState = JSON.parse(sessionStorage.getItem('gameState'));
    if (savedState) {
      setPlayerId(savedState.playerId);
      setIsCreator(savedState.isHost);
      if (savedState.gameState) {
        setGameState(savedState.gameState);
      }
    }

    // Handle WebSocket messages
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Game received message:', data);

      if (data.type === 'GAME_STATE_UPDATE') {
        setGameState(data.gameState);
        if (data.gameState.isRoundActive) {
          setGameStarted(true);
        }
      } else if (data.type === 'ERROR') {
        setConnectionError(data.message);
      }
    };
  }, [ws]);

  useEffect(() => {
    if (wsError && mode === 'multiplayer') {
      setConnectionError(wsError);
    }
  }, [wsError, mode]);

  const handleNextRound = () => {
    if (mode === 'single') {
      if (round < TOTAL_ROUNDS) {
        setShowResults(false);
        setRound(prev => prev + 1);
        setCurrentLocation(null);
        setGuessLocation(null);
        if (window.guessMarker) {
          window.guessMarker.setMap(null);
          window.guessMarker = null;
        }
      }
    } else {
      ws.send(JSON.stringify({ type: 'NEXT_ROUND' }));
    }
  };

  const handleLocationReady = (location) => {
    if (mode === 'single') {
      setCurrentLocation(location);
    }
  };

  const handleGuess = (guessLocation) => {
    if (mode === 'single') {
      if (!currentLocation) return;
      
      const points = calculateScore(currentLocation, guessLocation);
      setRoundScore(points);
      setTotalScore(prev => prev + points);
      setGuessLocation(guessLocation);
      setShowResults(true);
    } else {
      ws.send(JSON.stringify({
        type: 'MAKE_GUESS',
        location: guessLocation
      }));
    }
  };

  const allPlayersGuessed = (state) => {
    return Array.from(state.players.values()).every(player => player.hasGuessed);
  };

  const isGameOver = mode === 'multiplayer' 
    ? gameState?.roundNumber >= 5 
    : round > TOTAL_ROUNDS;

  const handleStartGame = () => {
    ws.send(JSON.stringify({ type: 'START_GAME', roomId }));
  };

  const handleRename = (newName) => {
    ws.send(JSON.stringify({ 
      type: 'RENAME_PLAYER',
      name: newName,
      roomId
    }));
  };

  // Clean up effect should only run for multiplayer
  useEffect(() => {
    if (mode !== 'multiplayer') return;

    return () => {
      if (gameState?.timer_interval) {
        clearInterval(gameState.timer_interval);
      }
    };
  }, [gameState, mode]);

  useEffect(() => {
    // Clean up game state when component unmounts
    return () => {
      if (mode === 'multiplayer') {
        sessionStorage.removeItem('gameState');
      }
    };
  }, [mode]);

  if (connectionError) {
    return (
      <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-6">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg
              hover:bg-purple-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'multiplayer' && isConnecting) {
    return (
      <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Connecting to Game</h2>
          <div className="text-gray-600">Please wait...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden m-0 p-0">
      {mode === 'multiplayer' && !gameStarted ? (
        <LobbyScreen
          gameState={gameState}
          roomId={roomId}
          isCreator={isCreator}
          onStartGame={handleStartGame}
          playerId={playerId}
          onRename={handleRename}
        />
      ) : (
        <>
          {/* Street View Container */}
          <div className="absolute inset-0 z-0">
            <StreetView 
              key={mode === 'single' ? round : gameState?.roundNumber}
              onReady={handleLocationReady}
              ws={ws}
              gameState={gameState}
              mode={mode}
            />
          </div>

          {/* UI Elements Container */}
          <div className="absolute inset-0 z-1 pointer-events-none">
            {/* Room ID Display */}
            {mode === 'multiplayer' && roomId && (
              <RoomIdDisplay roomId={roomId} />
            )}

            {/* Score Display */}
            <div className="absolute top-5 left-5 pointer-events-auto">
              {mode === 'multiplayer' ? (
                <ScoreDisplay 
                  gameState={gameState}
                  playerId={playerId}
                />
              ) : (
                <div className="bg-white/90 p-4 rounded-lg shadow-lg">
                  <div className="text-base font-semibold">Round {round}/{TOTAL_ROUNDS}</div>
                  <div className="text-xl font-bold text-purple-600">{totalScore} points</div>
                </div>
              )}
            </div>

            {/* Guess Map */}
            <div className="absolute bottom-5 right-5 pointer-events-auto">
              <GuessMap 
                key={mode === 'single' ? round : gameState?.roundNumber}
                onGuess={handleGuess}
                ws={ws}
                gameState={gameState}
                mode={mode}
                actualLocation={mode === 'single' ? currentLocation : gameState?.currentLocation}
                disabled={mode === 'single' ? !currentLocation : !gameState?.isRoundActive}
              />
            </div>

            {/* Results Overlay */}
            {showResults ? (
              <RoundResults
                gameState={mode === 'multiplayer' ? gameState : {
                  roundNumber: round,
                  players: [{
                    id: 'single',
                    score: roundScore,
                    totalScore: totalScore,
                    guess: guessLocation,
                  }],
                  currentLocation: currentLocation,
                }}
                playerId={mode === 'multiplayer' ? playerId : 'single'}
                isGameOver={mode === 'multiplayer' ? isGameOver : round >= TOTAL_ROUNDS}
                onNextRound={handleNextRound}
                mode={mode}
              />
            ) : (
              mode === 'multiplayer' && isCreator && !gameState?.isRoundActive && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                  <button
                    onClick={() => ws.send(JSON.stringify({ type: 'START_GAME' }))}
                    className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg
                      hover:bg-green-600 transition-colors"
                  >
                    Start Game
                  </button>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Game; 