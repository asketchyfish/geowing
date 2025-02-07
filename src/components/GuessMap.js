import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import ScoreScreen from './ScoreScreen';

const libraries = ['places'];

const GuessMap = ({ 
  onGuess, 
  onNextRound, 
  onEndGame,
  disabled, 
  actualLocation,
  isLastRound,
  isGameComplete,
  finalScore
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [showingScore, setShowingScore] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 20, lng: 0 });
  const mapRef = useRef(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly"
  });

  const handleMapClick = (e) => {
    if (disabled) return;
    const newLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    setSelectedLocation(newLocation);
    setMapCenter(newLocation);
  };

  const handleConfirmGuess = () => {
    if (selectedLocation && !disabled) {
      onGuess(selectedLocation);
      setShowingScore(true);
    }
  };

  const handleNextRound = () => {
    setShowingScore(false);
    setSelectedLocation(null);
    setMapCenter({ lat: 20, lng: 0 });
    setIsEnlarged(false);
    onNextRound();
  };

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

  if (showingScore && actualLocation) {
    return (
      <ScoreScreen
        actualLocation={actualLocation}
        guessLocation={selectedLocation}
        onNextRound={handleNextRound}
        isLastRound={isLastRound}
      />
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