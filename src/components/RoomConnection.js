import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const RoomConnection = () => {
  const { roomId } = useParams();
  
  useEffect(() => {
    const gameState = JSON.parse(sessionStorage.getItem('gameState'));
    if (gameState && globalWs?.readyState === WebSocket.OPEN) {
      // Send reconnect message with stored player ID
      globalWs.send(JSON.stringify({
        type: 'RECONNECT_TO_ROOM',
        roomId: gameState.roomId,
        playerId: gameState.playerId
      }));
    }
  }, [roomId]);

  return null;
};

export default RoomConnection; 