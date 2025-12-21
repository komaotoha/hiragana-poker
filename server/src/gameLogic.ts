import { HIRAGANA_CARDS, Player, Word, RankName, Ranking, Room } from './types';

/**
 * 配列をシャッフルする
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * デッキを作成する（各ひらがな2枚ずつ = 94枚）
 */
export function createDeck(): string[] {
  const deck: string[] = [];
  HIRAGANA_CARDS.forEach(card => {
    deck.push(card, card);
  });
  return shuffleArray(deck);
}

/**
 * デッキからカードを引く（破壊的操作）
 */
export function dealCards(deck: string[], count: number): string[] {
  return deck.splice(0, count);
}

/**
 * プレイヤーを作成する
 */
export function createPlayer(playerId: string, name: string): Player {
  return {
    playerId,
    name,
    hand: [],
    selectedForExchange: [],
    arrangedHand: [],
    registeredWords: [],
    score: 0,
    hasExchanged: false,
    hasArranged: false,
    hasDecided: false,
    isConnected: true,
  };
}

/**
 * ルームIDを生成する（6文字の英数字）
 */
export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 登録された役から最終的な役とスコアを計算する
 */
export function getRankFromWords(words: Word[]): { rank: RankName; score: number } {
  if (words.length === 0) {
    return { rank: '役なし', score: 0 };
  }

  const lengths = words.map(w => w.length).sort((a, b) => b - a);
  const totalLength = lengths.reduce((sum, l) => sum + l, 0);

  // ファイブカード: 5文字の言葉
  if (lengths.includes(5)) {
    return { rank: 'ファイブカード', score: 100 };
  }

  // フォーカード: 4文字の言葉
  if (lengths.includes(4)) {
    return { rank: 'フォーカード', score: 80 };
  }

  // フルハウス: 3文字 + 2文字
  if (lengths.includes(3) && lengths.includes(2) && totalLength >= 5) {
    return { rank: 'フルハウス', score: 70 };
  }

  // スリーカード: 3文字の言葉
  if (lengths.includes(3)) {
    return { rank: 'スリーカード', score: 50 };
  }

  // ツーペア: 2文字 × 2
  const twos = lengths.filter(l => l === 2);
  if (twos.length >= 2) {
    return { rank: 'ツーペア', score: 40 };
  }

  // ワンペア: 2文字の言葉
  if (lengths.includes(2)) {
    return { rank: 'ワンペア', score: 20 };
  }

  return { rank: '役なし', score: 0 };
}

/**
 * 役を長さ順（降順）にソートする
 */
export function sortWordsByRank(words: Word[]): Word[] {
  return [...words].sort((a, b) => b.length - a.length);
}

/**
 * ランキングを計算する
 */
export function calculateRankings(room: Room): Ranking[] {
  const rankings: Ranking[] = room.players
    .filter(p => p.isConnected)
    .map(p => ({
      playerId: p.playerId,
      playerName: p.name,
      rank: 0,
      score: p.score,
      approvedWord: p.registeredWords.find(w => {
        const rankInfo = getRankFromWords([w]);
        return rankInfo.score === p.score;
      }) || null,
    }))
    .sort((a, b) => b.score - a.score);

  // 順位を設定
  let currentRank = 1;
  rankings.forEach((r, i) => {
    if (i > 0 && r.score < rankings[i - 1].score) {
      currentRank = i + 1;
    }
    r.rank = currentRank;
  });

  return rankings;
}

/**
 * 投票結果を判定する
 */
export function getVoteResult(votes: Record<string, 'good' | 'bad'>): 'approved' | 'rejected' | 'tie' {
  const goodCount = Object.values(votes).filter(v => v === 'good').length;
  const badCount = Object.values(votes).filter(v => v === 'bad').length;

  if (goodCount > badCount) {
    return 'approved';
  } else if (badCount > goodCount) {
    return 'rejected';
  } else {
    return 'tie';
  }
}
