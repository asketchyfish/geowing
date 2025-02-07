import React from 'react';

const RoomIdDisplay = ({ roomId }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomId);
  };

  return (
    <div className="room-id">
      Room Code: {roomId}
      <button 
        onClick={copyToClipboard}
        className="copy-button"
      >
        Copy
      </button>
    </div>
  );
};

export default RoomIdDisplay; 