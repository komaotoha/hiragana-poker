import { useGame } from '../contexts/GameContext';
import '../styles/MemberStatus.css';

export function MemberStatus() {
  const {
    players,
    playerId,
    phase,
    exchangeSubmitted,
    arrangeSubmitted,
    wordsSubmitted,
    votedPlayers,
    currentJudgePlayer,
  } = useGame();

  const getStatusIcon = (pId: string) => {
    if (phase === 'exchange') {
      return exchangeSubmitted.has(pId) ? '✅' : '';
    }
    if (phase === 'arrange') {
      return arrangeSubmitted.has(pId) ? '✅' : '';
    }
    if (phase === 'create') {
      return wordsSubmitted.has(pId) ? '✅' : '';
    }
    if (phase === 'judge') {
      if (currentJudgePlayer?.playerId === pId) {
        return '（発表者）';
      }
      return votedPlayers.has(pId) ? '✅' : '';
    }
    return '';
  };

  return (
    <div className="member-status">
      <h3>メンバー</h3>
      <ul className="member-list">
        {players.map(player => (
          <li
            key={player.playerId}
            className={`member-item ${player.playerId === playerId ? 'me' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
          >
            <span className="member-name">{player.name}</span>
            <span className="member-icon">{getStatusIcon(player.playerId)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
