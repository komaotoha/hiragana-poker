import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import '../styles/RoomPage.css';

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  const {
    joinRoom,
    players,
    playerId,
    phase,
    error,
    clearError,
  } = useGame();

  // ゲーム開始時にゲームページへ遷移
  useEffect(() => {
    if (phase !== 'waiting' && playerId) {
      navigate(`/game/${roomId}`);
    }
  }, [phase, playerId, roomId, navigate]);

  // エラー処理
  useEffect(() => {
    if (error) {
      alert(error.message);
      clearError();
      if (error.code === 'ROOM_NOT_FOUND' || error.code === 'ROOM_FULL' || error.code === 'ROOM_ALREADY_STARTED') {
        navigate('/');
      }
    }
  }, [error, clearError, navigate]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ひらがな作文ポーカー',
          text: 'ひらがな作文ポーカーに参加しよう！',
          url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      alert('名前を入力してください');
      return;
    }
    if (!roomId) return;

    joinRoom(roomId, playerName.trim());
    setHasJoined(true);
  };

  return (
    <div className="room-page">
      <h1 className="title">ひらがな作文ポーカー</h1>

      <div className="room-info">
        <p className="room-id">ルームID: {roomId}</p>

        <button className="share-btn" onClick={handleShare}>
          招待URLを共有
        </button>
      </div>

      {!hasJoined ? (
        <div className="join-section">
          <input
            type="text"
            className="name-input"
            placeholder="あなたの名前"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={10}
          />
          <button className="join-btn" onClick={handleJoin}>
            参加する
          </button>
        </div>
      ) : (
        <div className="waiting-section">
          <div className="player-list">
            <h2>参加者</h2>
            {players.map((player) => (
              <div
                key={player.playerId}
                className={`player-item ${player.playerId === playerId ? 'me' : ''}`}
              >
                {player.name}
                {player.playerId === playerId && ' (あなた)'}
              </div>
            ))}
          </div>

          <p className="waiting-text">
            {players.length}人が参加中...
          </p>

          <div className="waiting-animation">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      )}
    </div>
  );
}
