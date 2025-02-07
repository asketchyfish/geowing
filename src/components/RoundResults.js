import React from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';

const RoundResults = ({ gameState, playerId, isGameOver, onNextRound, mode = 'multiplayer' }) => {
  const mapContainerStyle = {
    width: '100%',
    height: '300px',
    marginBottom: '1rem',
    borderRadius: '0.5rem'
  };

  const getMapBounds = () => {
    if (!gameState.currentLocation || !gameState.players) return null;
    
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(gameState.currentLocation);
    
    // In single player mode, only add the first player's guess
    const playersToShow = mode === 'single' 
      ? [gameState.players[0]]
      : gameState.players;
    
    playersToShow.forEach(player => {
      if (player.guess) {
        bounds.extend(player.guess);
      }
    });
    
    return bounds;
  };

  const playerColors = {
    [playerId]: '#6366F1', // Indigo for current player
    default: '#9CA3AF'  // Gray for other players
  };

  // Sort players by score for both single and multiplayer
  const sortedPlayers = Array.from(mode === 'single' ? [gameState.players[0]] : gameState.players.values())
    .sort((a, b) => {
      // Use totalScore for both modes
      return b.totalScore - a.totalScore;
    });

  const calculateDistance = (pos1, pos2) => {
    if (!pos1 || !pos2) return null;
    // Use the haversine formula to calculate distance
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance);
  };

  const getPlayerDistance = (player) => {
    if (!player.guess || !gameState.currentLocation) return null;
    return calculateDistance(player.guess, gameState.currentLocation);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-4xl w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {isGameOver ? 'Final Results' : `Round ${gameState.roundNumber} Results`}
        </h2>

        {/* Map showing guesses */}
        <div className="mb-6 relative z-[1001]">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            options={{
              disableDefaultUI: true,
              clickableIcons: false,
            }}
            onLoad={map => {
              const bounds = getMapBounds();
              if (bounds) {
                map.fitBounds(bounds, { padding: 50 });
              }
            }}
          >
            {/* Actual location marker */}
            {gameState.currentLocation && (
              <Marker
                position={gameState.currentLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#22C55E',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#ffffff',
                }}
              />
            )}

            {/* Player guess markers and lines */}
            {sortedPlayers.map((player) => {
              if (!player.guess) return null;
              const color = mode === 'single' || player.id === playerId 
                ? playerColors[playerId] 
                : playerColors.default;
              
              return (
                <React.Fragment key={player.id}>
                  <Marker
                    position={player.guess}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: color,
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: '#ffffff',
                    }}
                  />
                  {gameState.currentLocation && (
                    <Polyline
                      path={[player.guess, gameState.currentLocation]}
                      options={{
                        strokeColor: color,
                        strokeWeight: 2,
                        strokeOpacity: 0.8,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-600">Actual Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-sm text-gray-600">
              {mode === 'single' ? 'Your Guess' : 'Your Guess'}
            </span>
          </div>
          {mode === 'multiplayer' && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm text-gray-600">Other Players</span>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          {sortedPlayers.map((player, index) => {
            const distance = getPlayerDistance(player);
            return (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  mode === 'single' || player.id === playerId ? 'bg-purple-100' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {mode === 'multiplayer' && (
                    <span className="text-xl font-bold text-gray-500">#{index + 1}</span>
                  )}
                  <span className={`font-semibold ${
                    mode === 'single' || player.id === playerId ? 'text-purple-600' : 'text-gray-700'
                  }`}>
                    {mode === 'single' ? 'Your Results' : player.id === playerId ? 'You' : `Player ${player.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  {distance !== null && (
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-600">Distance</span>
                      <span className="text-sm text-gray-600">{distance} km</span>
                    </div>
                  )}
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-600">This Round</span>
                    <span className="text-base text-gray-800">{player.score} pts</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-600">Total Score</span>
                    <span className="text-lg font-bold text-purple-600">
                      {player.totalScore} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isGameOver ? (
          <div className="pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNextRound();
              }}
              className="w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg
                hover:bg-purple-600 transition-colors"
            >
              Next Round
            </button>
          </div>
        ) : (
          <div className="space-y-4 pointer-events-auto">
            <div className="text-lg text-gray-600 mb-6">
              Thanks for playing!
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = '/';
              }}
              className="w-full px-6 py-3 bg-purple-500 text-white font-semibold rounded-lg
                hover:bg-purple-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundResults; 