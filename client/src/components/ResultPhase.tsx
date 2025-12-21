import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import '../styles/ResultPhase.css';

export function ResultPhase() {
  const navigate = useNavigate();
  const { rankings, restartVotes, requestRestart, playerId, players } = useGame();

  const hasVotedRestart = playerId ? restartVotes[playerId] : false;

  const handleRestart = () => {
    requestRestart();
  };

  const handleExit = () => {
    navigate('/');
  };

  const restartVoteCount = Object.values(restartVotes).filter(v => v).length;
  const totalPlayers = players.filter(p => p.isConnected).length;

  return (
    <div className="result-phase">
      <h1 className="result-title">結果発表</h1>

      <div className="rankings">
        {rankings.map((ranking, index) => (
          <div
            key={ranking.playerId}
            className={`ranking-item ${index === 0 ? 'winner' : ''} ${ranking.playerId === playerId ? 'me' : ''}`}
          >
            <div className="rank-number">
              {index === 0 && '🏆'}
              {ranking.rank}位
            </div>
            <div className="player-info">
              <span className="player-name">{ranking.playerName}</span>
              {ranking.approvedWord && (
                <span className="approved-word">「{ranking.approvedWord.word}」</span>
              )}
            </div>
            <div className="player-score">{ranking.score}点</div>
          </div>
        ))}
      </div>

      <div className="result-actions">
        {!hasVotedRestart ? (
          <>
            <button className="btn primary" onClick={handleRestart}>
              もう一度遊ぶ
            </button>
            <button className="btn secondary" onClick={handleExit}>
              終了
            </button>
          </>
        ) : (
          <div className="restart-waiting">
            <p>再戦を待っています... ({restartVoteCount}/{totalPlayers})</p>
            <button className="btn secondary" onClick={handleExit}>
              終了
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
