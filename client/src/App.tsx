import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { TopPage } from './pages/TopPage';
import { RoomPage } from './pages/RoomPage';
import { GamePage } from './pages/GamePage';
import './styles/common.css';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <GameProvider>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/game/:roomId" element={<GamePage />} />
          </Routes>
        </GameProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
