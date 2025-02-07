import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MultiplayerMenu from './components/MultiplayerMenu';
import Game from './components/Game';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MultiplayerMenu />} />
        <Route path="/single-player" element={<Game mode="single" />} />
        <Route path="/room/:roomId" element={<Game mode="multiplayer" />} />
      </Routes>
    </Router>
  );
};

export default App; 