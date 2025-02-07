const WebSocket = require('ws');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

const rooms = new Map();

const AREAS = [
  { name: 'Western Europe', bounds: { north: 60, south: 35, east: 25, west: -10 } },
  { name: 'USA', bounds: { north: 48, south: 25, east: -65, west: -125 } },
  { name: 'Japan', bounds: { north: 45, south: 31, east: 146, west: 129 } },
  { name: 'New Zealand', bounds: { north: -34, south: -47, east: 179, west: 166 } },
  { name: 'South Africa', bounds: { north: -22, south: -35, east: 33, west: 16 } }
];

const ROOM_ID_REGEX = /^[a-z0-9]{6}$/;
const NAME_REGEX = /^[a-zA-Z0-9 ]{1,20}$/;

function createRoom() {
  return Math.random().toString(36).substring(2, 8);
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function generateRandomLocation() {
  // Randomly select an area
  const area = AREAS[Math.floor(Math.random() * AREAS.length)];
  const bounds = area.bounds;
  
  // Get random coordinates within the bounds
  const lat = Math.random() * (bounds.north - bounds.south) + bounds.south;
  const lng = Math.random() * (bounds.east - bounds.west) + bounds.west;
  
  return { lat, lng };
}

function allPlayersGuessed(room) {
  return Array.from(room.players.values()).every(player => player.hasGuessed);
}

function endRound(room) {
  room.isRoundActive = false;
  broadcastGameState(room);
}

function calculateScore(actualLocation, guessLocation) {
  const R = 6371; // Earth's radius in km
  
  // Convert coordinates to radians
  const lat1 = actualLocation.lat * Math.PI / 180;
  const lat2 = guessLocation.lat * Math.PI / 180;
  const lon1 = actualLocation.lng * Math.PI / 180;
  const lon2 = guessLocation.lng * Math.PI / 180;

  // Haversine formula
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1) * Math.cos(lat2) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const km = R * c;
  const miles = km * 0.621371;

  // No points beyond 1000 miles
  if (miles > 1000) return 0;

  // Calculate points using logarithmic scale
  const points = Math.round(1000 * (1 - Math.log(miles + 1) / Math.log(1001)));
  return Math.max(0, points);
}

function cleanupEmptyRooms() {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.size === 0) {
      if (room.timer_interval) {
        clearInterval(room.timer_interval);
      }
      rooms.delete(roomId);
    }
  }
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  let playerId = null;
  let currentRoom = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // If we have a stored playerId from sessionStorage, use it
      if (data.playerId) {
        playerId = data.playerId;
      } else {
        // Only generate new playerId if we don't have one
        playerId = playerId || Math.random().toString(36).substring(7);
      }
      
      console.log('Received message:', data.type, 'from player:', playerId);
      
      switch (data.type) {
        case 'CREATE_ROOM':
          const roomId = createRoom();
          currentRoom = getRoom(roomId);
          ws.roomId = roomId;
          
          const creatorPlayer = {
            id: playerId,
            score: 0,
            totalScore: 0,
            hasGuessed: false,
            name: null,
            isHost: true
          };
          
          // Create the room with the player already in it
          const newRoom = {
            roomId,
            isRoundActive: false,
            currentLocation: null,
            players: new Map([[playerId, creatorPlayer]]),
            timer: 60,
            roundNumber: 0,
            maxRounds: 5,
            isGameOver: false,
            gameStarted: false
          };
          
          rooms.set(roomId, newRoom);
          ws.roomId = roomId;
          
          console.log('Created room:', roomId, 'with host:', playerId);
          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomId,
            playerId,
            isHost: true,
            gameState: {
              ...newRoom,
              players: [creatorPlayer]
            }
          }));
          break;

        case 'RECONNECT_TO_ROOM':
          const existingRoom = getRoom(data.roomId);
          if (existingRoom) {
            const existingPlayer = existingRoom.players.get(data.playerId);
            if (existingPlayer) {
              ws.roomId = data.roomId;
              console.log('Player reconnected to room:', data.roomId, 'player:', data.playerId);
              ws.send(JSON.stringify({
                type: 'RECONNECTED',
                gameState: {
                  ...existingRoom,
                  players: Array.from(existingRoom.players.values())
                }
              }));
              return;
            }
          }
          // If we get here, either room or player wasn't found
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Room or player not found'
          }));
          break;

        case 'JOIN_ROOM':
          if (!ROOM_ID_REGEX.test(data.roomId)) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Invalid room ID format'
            }));
            return;
          }
          currentRoom = getRoom(data.roomId);
          if (currentRoom) {
            ws.roomId = data.roomId;
            
            // Check if room is empty (all players disconnected)
            const isEmptyRoom = currentRoom.players.size === 0;
            
            // Add new player
            const newPlayer = {
              id: playerId,
              score: 0,
              totalScore: 0,
              hasGuessed: false,
              name: null,
              isHost: isEmptyRoom // Make this player host if room is empty
            };
            currentRoom.players.set(playerId, newPlayer);
            console.log('Player joined room:', data.roomId, 'player:', playerId, 'isHost:', isEmptyRoom);

            // Send initial state to the new player
            const joinResponse = {
              type: 'JOINED_ROOM',
              playerId,
              isHost: isEmptyRoom,
              gameState: {
                ...currentRoom,
                players: Array.from(currentRoom.players.values())
              }
            };
            console.log('Sending JOINED_ROOM response:', joinResponse);
            ws.send(JSON.stringify(joinResponse));

            // Broadcast updated state to all players
            broadcastGameState(currentRoom, data.roomId);
          } else {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Room not found'
            }));
          }
          break;

        case 'MAKE_GUESS':
          if (currentRoom) {
            handlePlayerGuess(playerId, data.location, currentRoom);
          }
          break;

        case 'START_GAME':
          if (currentRoom && !currentRoom.isRoundActive) {
            startNewRound(currentRoom, data.roomId);
          }
          break;

        case 'RENAME_PLAYER':
          if (!NAME_REGEX.test(data.name)) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              message: 'Invalid name format'
            }));
            return;
          }
          if (currentRoom) {
            const player = currentRoom.players.get(playerId);
            if (player) {
              player.name = data.name;
              broadcastGameState(currentRoom, data.roomId);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    if (currentRoom) {
      currentRoom.players.delete(playerId);
      
      // If host left, assign new host if there are other players
      if (currentRoom.players.size > 0) {
        const remainingPlayers = Array.from(currentRoom.players.values());
        if (remainingPlayers.some(p => p.isHost)) {
          // There's still a host, do nothing
        } else {
          // Assign first remaining player as host
          const newHost = remainingPlayers[0];
          currentRoom.players.get(newHost.id).isHost = true;
        }
        broadcastGameState(currentRoom, ws.roomId);
      }
      
      // Cleanup empty rooms
      cleanupEmptyRooms();
    }
  });
});

function startNewRound(room, roomId) {
  if (room.roundNumber >= room.maxRounds) {
    room.isGameOver = true;
    broadcastGameState(room, roomId);
    return;
  }

  room.isRoundActive = true;
  room.gameStarted = true;
  room.roundNumber++;
  room.timer = 60;
  room.currentLocation = generateRandomLocation();
  room.players.forEach(player => {
    player.hasGuessed = false;
    player.score = 0;
  });
  
  broadcastGameState(room, roomId);
  startTimer(room, roomId);
}

function startTimer(room, roomId) {
  // Clear any existing timer
  if (room.timer_interval) {
    clearInterval(room.timer_interval);
  }

  room.timer_interval = setInterval(() => {
    room.timer--;
    
    if (room.timer <= 0 || allPlayersGuessed(room)) {
      clearInterval(room.timer_interval);
      room.timer_interval = null;
      endRound(room);
    } else {
      broadcastGameState(room, roomId);
    }
  }, 1000);
}

function handlePlayerGuess(playerId, guessLocation, room) {
  const player = room.players.get(playerId);
  if (player && !player.hasGuessed) {
    player.hasGuessed = true;
    // Calculate score based on distance
    const roundScore = calculateScore(guessLocation, room.currentLocation);
    player.score = roundScore;
    player.totalScore += roundScore;
    broadcastGameState(room, room.roomId);
  }
}

function broadcastGameState(gameState, roomId) {
  // Convert Map to array and ensure we're sending the correct format
  const players = Array.from(gameState.players.entries()).map(([id, player]) => ({
    ...player,
    id
  }));

  const gameStateMessage = {
    type: 'GAME_STATE_UPDATE',
    gameState: {
      ...gameState,
      players
    }
  };
  
  console.log('Broadcasting game state:', gameStateMessage);
  const messageString = JSON.stringify(gameStateMessage);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
      client.send(messageString);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 