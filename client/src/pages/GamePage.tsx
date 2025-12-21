import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { MemberStatus } from '../components/MemberStatus';
import { HelpButton } from '../components/HelpModal';
import { ExchangePhase } from '../components/ExchangePhase';
import { ArrangePhase } from '../components/ArrangePhase';
import { CreatePhase } from '../components/CreatePhase';
import { JudgePhase } from '../components/JudgePhase';
import { ResultPhase } from '../components/ResultPhase';
import '../styles/GamePage.css';

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { phase, playerId } = useGame();

  useEffect(() => {
    if (!playerId) {
      navigate(`/room/${roomId}`);
    }
  }, [playerId, roomId, navigate]);

  const renderPhase = () => {
    switch (phase) {
      case 'exchange':
        return <ExchangePhase />;
      case 'arrange':
        return <ArrangePhase />;
      case 'create':
        return <CreatePhase />;
      case 'judge':
        return <JudgePhase />;
      case 'result':
        return <ResultPhase />;
      default:
        return <div>Loading...</div>;
    }
  };

  const getPhaseTitle = () => {
    switch (phase) {
      case 'exchange':
        return 'カード交換';
      case 'arrange':
        return '並び替え';
      case 'create':
        return '役作成';
      case 'judge':
        return '判定タイム';
      case 'result':
        return '結果発表';
      default:
        return '';
    }
  };

  return (
    <div className="game-page">
      <header className="game-header">
        <h1 className="phase-title">{getPhaseTitle()}</h1>
        <HelpButton />
      </header>

      <div className="game-content">
        <aside className="member-sidebar">
          <MemberStatus />
        </aside>

        <main className="game-main">
          {renderPhase()}
        </main>
      </div>
    </div>
  );
}
