import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

let globalWs = null;

export const useWebSocket = (enabled = true) => {
  const [ws, setWs] = useState(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(enabled);
  const navigate = useNavigate();

  const connectWebSocket = useCallback(() => {
    if (!enabled) return;
    
    setIsConnecting(true);
    setError('');
    
    if (globalWs?.readyState === WebSocket.OPEN) {
      setWs(globalWs);
      setIsConnecting(false);
      return;
    }

    const websocket = new WebSocket('ws://localhost:3001');
    globalWs = websocket;
    
    websocket.onopen = () => {
      console.log('WebSocket connection established');
      setWs(websocket);
      setIsConnecting(false);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);

      if (data.type === 'ROOM_CREATED' || data.type === 'JOINED_ROOM') {
        const gameState = {
          roomId: data.type === 'ROOM_CREATED' ? data.roomId : data.gameState.roomId,
          playerId: data.playerId,
          isHost: data.isHost,
          gameState: data.gameState
        };
        sessionStorage.setItem('gameState', JSON.stringify(gameState));
        navigate(`/room/${gameState.roomId}`);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Failed to connect to game server');
      setIsConnecting(false);
      globalWs = null;
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setWs(null);
      setIsConnecting(false);
      globalWs = null;
    };
  }, [enabled, navigate]);

  useEffect(() => {
    connectWebSocket();
  }, [connectWebSocket]);

  return { 
    ws: enabled ? ws : null, 
    error: enabled ? error : '', 
    isConnecting: enabled ? isConnecting : false
  };
}; 