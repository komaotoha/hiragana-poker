import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import '../styles/TopPage.css';

export function TopPage() {
  const [maxPlayers, setMaxPlayers] = useState(4);
  const navigate = useNavigate();
  const { createRoom, roomId } = useGame();

  useEffect(() => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  }, [roomId, navigate]);

  const handleCreateRoom = () => {
    createRoom(maxPlayers);
  };

  return (
    <div className="top-page">
      <h1 className="title">ひらがな作文ポーカー</h1>

      <div className="create-room-section">
        <div className="player-select">
          <label htmlFor="max-players">人数を選択</label>
          <div className="player-buttons">
            {[2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                className={`player-btn ${maxPlayers === num ? 'selected' : ''}`}
                onClick={() => setMaxPlayers(num)}
              >
                {num}人
              </button>
            ))}
          </div>
        </div>

        <button className="create-btn" onClick={handleCreateRoom}>
          ルームを作成
        </button>
      </div>
    </div>
  );
}
