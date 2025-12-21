import { useGame } from '../contexts/GameContext';
import '../styles/JudgePhase.css';

export function JudgePhase() {
  const {
    playerId,
    players,
    currentJudgePlayer,
    currentWord,
    votedPlayers,
    voteResult,
    vote,
    revote,
  } = useGame();

  if (!currentJudgePlayer) {
    return (
      <div className="judge-phase">
        <p className="message">判定を開始しています...</p>
      </div>
    );
  }

  const isPresenter = currentJudgePlayer.playerId === playerId;
  const hasVoted = playerId ? votedPlayers.has(playerId) : false;

  return (
    <div className="judge-phase">
      <div className="judge-header">
        <h2>【{currentJudgePlayer.playerName}】の役を判定中</h2>
      </div>

      {currentWord && (
        <div className="word-display">
          <div className="word-text">「{currentWord.word.word}」</div>
          <div className="word-rank">{currentWord.rank}</div>
        </div>
      )}

      {/* 投票状況 */}
      <div className="vote-status">
        {players.map(player => {
          const isCurrentPresenter = player.playerId === currentJudgePlayer.playerId;

          let statusIcon = '';
          if (isCurrentPresenter) {
            statusIcon = '（発表者）';
          } else if (voteResult && voteResult.votes[player.playerId]) {
            statusIcon = voteResult.votes[player.playerId] === 'good' ? '👍' : '👎';
          } else if (votedPlayers.has(player.playerId)) {
            statusIcon = '✅';
          }

          return (
            <div
              key={player.playerId}
              className={`voter ${player.playerId === playerId ? 'me' : ''}`}
            >
              <span className="voter-name">{player.name}</span>
              <span className="voter-status">{statusIcon}</span>
            </div>
          );
        })}
      </div>

      {/* 投票結果 */}
      {voteResult && (
        <div className={`vote-result ${voteResult.result}`}>
          {voteResult.result === 'approved' && '👍多数 → 承認！'}
          {voteResult.result === 'rejected' && '👎多数 → 却下'}
          {voteResult.result === 'tie' && (
            <div className="tie-result">
              <p>同数です！</p>
              <button className="btn primary" onClick={revote}>
                再投票
              </button>
            </div>
          )}
        </div>
      )}

      {/* 投票ボタン */}
      {!isPresenter && !hasVoted && !voteResult && currentWord && (
        <div className="vote-buttons">
          <button className="btn vote-good" onClick={() => vote('good')}>
            いいね 👍
          </button>
          <button className="btn vote-bad" onClick={() => vote('bad')}>
            ダメ 👎
          </button>
        </div>
      )}

      {isPresenter && !voteResult && (
        <div className="presenter-message">
          あなたの役を判定中です...
        </div>
      )}

      {!isPresenter && hasVoted && !voteResult && (
        <div className="waiting-message">
          他のプレイヤーの投票を待っています...
        </div>
      )}
    </div>
  );
}
