import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

// Only include each library once
const libraries = ['places'];

const GuessMap = ({ 
  onGuess, 
  onNextRound, 
  onEndGame,
  disabled, 
  actualLocation,
  isLastRound,
  isGameComplete,
  finalScore,
  setSelectedLocation,
  ws,
  gameState,
  mode
}) => {
  const [selectedLocation, _setSelectedLocation] = useState(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showingScore, setShowingScore] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20, lng: 0 });
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly"
  });

  // Update the internal state and expose it to parent
  const setLocationState = (location) => {
    _setSelectedLocation(location);
    setSelectedLocation?.(location);  // Notify parent if they want to know
  };

  const handleMapClick = (e) => {
    if (disabled) return;
    const newLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setLocationState(newLocation);
    setMapCenter(newLocation);
  };

  const handleConfirmGuess = () => {
    if (selectedLocation && !disabled) {
      if (mode === 'multiplayer') {
        ws.send(JSON.stringify({
          type: 'MAKE_GUESS',
          location: selectedLocation
        }));
      } else {
        onGuess(selectedLocation);
      }
      setShowingScore(true);
    }
  };

  const handleNextRound = () => {
    setShowingScore(false);
    setLocationState(null);  // Use the new setter
    setMapCenter({ lat: 20, lng: 0 });
    setIsEnlarged(false);
    onNextRound();
  };

  useEffect(() => {
    // Only run cleanup for multiplayer mode
    if (!ws || mode !== 'multiplayer') return;
    
    return () => {
      if (window.guessMarker) {
        window.guessMarker.setMap(null);
        window.guessMarker = null;
      }
    };
  }, [ws, gameState?.roundNumber, mode]);

  if (loadError) return <div>Error loading maps: {loadError.message}</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  if (isGameComplete) {
    return (
      <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Game Complete!</h2>
          <div className="text-4xl font-bold text-purple-600 mb-6">
            Final Score: {finalScore}
          </div>
          <button 
            onClick={onEndGame}
            className="px-10 py-4 text-lg bg-purple-500 text-white font-semibold rounded-full
              cursor-pointer transition-colors hover:bg-purple-600"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onMouseEnter={() => setIsEnlarged(true)}
      onMouseLeave={() => setIsEnlarged(false)}
      className="bg-white rounded-lg"
    >
      <div className={`
        transition-all duration-300 ease-in-out border-2 border-white rounded-lg overflow-hidden
        ${isEnlarged ? 'w-[500px] h-[500px]' : 'w-[200px] h-[200px]'}
      `}>
        <GoogleMap
          mapContainerClassName="w-full h-full"
          center={mapCenter}
          zoom={2}
          onClick={handleMapClick}
          onLoad={map => {
            mapRef.current = map;
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            gestureHandling: disabled ? 'none' : 'auto',
            styles: disabled ? [{ stylers: [{ saturation: -100 }] }] : undefined,
          }}
        >
          {selectedLocation && (
            <Marker position={selectedLocation} />
          )}
        </GoogleMap>
      </div>
      <button
        onClick={handleConfirmGuess}
        disabled={!selectedLocation || disabled}
        className={`
          w-full transition-all duration-300 rounded-b-lg text-white font-semibold
          ${isEnlarged ? 'py-3 text-base' : 'py-2 text-sm'}
          ${!selectedLocation || disabled 
            ? 'bg-gray-400 cursor-not-allowed opacity-70'
            : 'bg-green-500 hover:bg-green-600 cursor-pointer'}
        `}
      >
        Confirm Guess
      </button>
    </div>
  );
};

export default GuessMap; 