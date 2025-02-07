import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, StreetViewPanorama, useLoadScript } from '@react-google-maps/api';

const libraries = ['places'];

const AREAS = [
  { name: 'Western Europe', bounds: { north: 60, south: 35, east: 25, west: -10 } },
  { name: 'USA', bounds: { north: 48, south: 25, east: -65, west: -125 } },
  { name: 'Japan', bounds: { north: 45, south: 31, east: 146, west: 129 } },
  { name: 'New Zealand', bounds: { north: -34, south: -47, east: 179, west: 166 } },
  { name: 'South Africa', bounds: { north: -22, south: -35, east: 33, west: 16 } }
];

const mapContainerStyle = {
  height: '100%',
  width: '100%'
};

const StreetView = ({ onReady }) => {
  const [streetViewService, setStreetViewService] = useState(null);
  const [validLocation, setValidLocation] = useState(null);
  const [panorama, setPanorama] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly"
  });

  const getRandomLocation = useCallback(() => {
    // Randomly select an area
    const area = AREAS[Math.floor(Math.random() * AREAS.length)];
    const bounds = area.bounds;
    
    // Get random coordinates within the bounds
    const lat = Math.random() * (bounds.north - bounds.south) + bounds.south;
    const lng = Math.random() * (bounds.east - bounds.west) + bounds.west;
    
    return { lat, lng };
  }, []);

  const checkStreetView = useCallback((location) => {
    return new Promise((resolve) => {
      if (!streetViewService) return resolve(false);

      streetViewService.getPanorama({
        location: location,
        radius: 50000, // Search radius in meters
        source: window.google.maps.StreetViewSource.OUTDOOR // Only outdoor Street View
      }, (data, status) => {
        if (status === window.google.maps.StreetViewStatus.OK) {
          resolve({
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
            pano: data.location.pano
          });
        } else {
          resolve(false);
        }
      });
    });
  }, [streetViewService]);

  const findValidLocation = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const location = getRandomLocation();
      const validLocationData = await checkStreetView(location);
      
      if (validLocationData) {
        setValidLocation(validLocationData);
        if (panorama) {
          panorama.setPano(validLocationData.pano);
        }
        onReady(validLocationData);
        return;
      }
      
      attempts++;
    }
    
    console.error('Failed to find valid Street View location');
  }, [getRandomLocation, checkStreetView, onReady, panorama]);

  useEffect(() => {
    if (isLoaded && !streetViewService) {
      setStreetViewService(new window.google.maps.StreetViewService());
    }
  }, [isLoaded]);

  useEffect(() => {
    if (streetViewService && !validLocation) {
      findValidLocation();
    }
  }, [streetViewService, findValidLocation, validLocation]);

  if (loadError) {
    console.error('Maps load error:', loadError);
    return <div>Error loading maps. Please check your API key and configuration.</div>;
  }
  
  if (!isLoaded || !validLocation) return <div>Loading maps...</div>;

  return (
    <div className="w-full h-full">
      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={validLocation}
        zoom={14}
      >
        <StreetViewPanorama
          position={validLocation}
          visible={true}
          onLoad={(pano) => {
            if (pano) {
              setPanorama(pano);
              const location = pano.getPosition();
              onReady({
                lat: location.lat(),
                lng: location.lng()
              });
            }
          }}
          options={{
            addressControl: false,
            fullscreenControl: false,
            enableCloseButton: false,
            showRoadLabels: false,
            motionTracking: false,
            motionTrackingControl: false,
            panControl: true,
            zoomControl: true,
            panControlOptions: {
              position: window.google.maps.ControlPosition.TOP_RIGHT
            },
            zoomControlOptions: {
              position: window.google.maps.ControlPosition.TOP_RIGHT
            },
            pov: {
              heading: Math.random() * 360,
              pitch: 0
            }
          }}
        />
      </GoogleMap>
    </div>
  );
};

export default StreetView; 