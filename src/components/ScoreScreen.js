import React, { useEffect, useCallback } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { calculateScore, calculateDistance } from '../utils/scoring';

const ScoreScreen = ({ actualLocation, guessLocation, onNextRound, isLastRound }) => {
  const mapRef = React.useRef(null);

  const getScore = useCallback(() => {
    return calculateScore(actualLocation, guessLocation);
  }, [actualLocation, guessLocation]);

  const getDistance = useCallback(() => {
    return calculateDistance(actualLocation, guessLocation);
  }, [actualLocation, guessLocation]);

  const fitBounds = useCallback(() => {
    if (!mapRef.current) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(actualLocation);
    bounds.extend(guessLocation);
    
    // Add padding to bounds
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const padding = {
      north: (ne.lat() - sw.lat()) * 0.2,
      south: (ne.lat() - sw.lat()) * 0.2,
      east: (ne.lng() - sw.lng()) * 0.2,
      west: (ne.lng() - sw.lng()) * 0.2
    };
    
    bounds.extend({ lat: ne.lat() + padding.north, lng: ne.lng() + padding.east });
    bounds.extend({ lat: sw.lat() - padding.south, lng: sw.lng() - padding.west });
    
    mapRef.current.fitBounds(bounds);
  }, [actualLocation, guessLocation]);

  useEffect(() => {
    if (mapRef.current) {
      fitBounds();
    }
  }, [fitBounds]);

  return (
    <div className="fixed inset-0 bg-black/85 z-[1000] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center w-full max-w-[90%] max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Round Results
        </h2>
        
        <div className="w-full h-[400px] rounded-xl overflow-hidden mb-4">
          <GoogleMap
            mapContainerClassName="w-full h-full"
            onLoad={(map) => {
              mapRef.current = map;
              fitBounds();
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
            }}
          >
            <Marker 
              position={actualLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4CAF50',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
            <Marker 
              position={guessLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#f44336',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
            />
            <Polyline
              path={[actualLocation, guessLocation]}
              options={{
                strokeColor: '#000000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                geodesic: true,
              }}
            />
          </GoogleMap>
        </div>

        <div className="text-xl text-gray-600 mb-2">
          {getDistance()}
        </div>
        
        <div className="text-2xl font-bold text-purple-600 mb-4">
          {getScore()} points
        </div>

        <button 
          onClick={onNextRound}
          className="px-10 py-4 text-lg bg-green-500 text-white font-semibold rounded-full
            cursor-pointer transition-colors hover:bg-green-600"
        >
          {isLastRound ? 'End Game' : 'Next Round'}
        </button>
      </div>
    </div>
  );
};

export default ScoreScreen; 