export const calculateScore = (actualLocation, guessLocation) => {
  const R = 6371; // Earth's radius in km
  const dLat = (actualLocation.lat - guessLocation.lat) * Math.PI / 180;
  const dLon = (actualLocation.lng - guessLocation.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(guessLocation.lat * Math.PI / 180) * Math.cos(actualLocation.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const km = R * c;
  const miles = km * 0.621371;

  // No points beyond 1000 miles
  if (miles > 1000) return 0;

  // Calculate points using logarithmic scale
  // Score = 5000 * (1 - log(distance + 1) / log(1001))
  const points = Math.round(5000 * (1 - Math.log(miles + 1) / Math.log(1001)));
  return Math.max(0, points);
};

export const calculateDistance = (actualLocation, guessLocation) => {
  const R = 6371; // Earth's radius in km
  const dLat = (actualLocation.lat - guessLocation.lat) * Math.PI / 180;
  const dLon = (actualLocation.lng - guessLocation.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(guessLocation.lat * Math.PI / 180) * Math.cos(actualLocation.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const km = R * c;
  const miles = km * 0.621371;

  if (miles < 1) {
    return `${Math.round(miles * 5280)} feet away`;
  }
  return `${Math.round(miles)} miles away`;
}; 