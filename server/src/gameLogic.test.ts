import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  createDeck,
  dealCards,
  createPlayer,
  generateRoomId,
  getRankFromWords,
  sortWordsByRank,
  calculateRankings,
  getVoteResult,
} from './gameLogic';
import { HIRAGANA_CARDS, Word, Room } from './types';

describe('shuffleArray', () => {
  it('配列の長さが変わらない', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('元の配列を変更しない', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('同じ要素を含む', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
});

describe('createDeck', () => {
  it('94枚のカードが作成される', () => {
    const deck = createDeck();
    expect(deck.length).toBe(94); // 47文字 × 2枚
  });

  it('各ひらがなが2枚ずつ含まれる', () => {
    const deck = createDeck();
    HIRAGANA_CARDS.forEach(card => {
      const count = deck.filter(c => c === card).length;
      expect(count).toBe(2);
    });
  });
});

describe('dealCards', () => {
  it('指定した枚数のカードを引ける', () => {
    const deck = ['あ', 'い', 'う', 'え', 'お', 'か', 'き'];
    const dealt = dealCards(deck, 3);
    expect(dealt).toEqual(['あ', 'い', 'う']);
  });

  it('デッキから引いたカードが減る', () => {
    const deck = ['あ', 'い', 'う', 'え', 'お'];
    dealCards(deck, 2);
    expect(deck.length).toBe(3);
    expect(deck).toEqual(['う', 'え', 'お']);
  });
});

describe('createPlayer', () => {
  it('正しい初期状態のプレイヤーが作成される', () => {
    const player = createPlayer('player-1', 'たろう');

    expect(player.playerId).toBe('player-1');
    expect(player.name).toBe('たろう');
    expect(player.hand).toEqual([]);
    expect(player.score).toBe(0);
    expect(player.hasExchanged).toBe(false);
    expect(player.hasArranged).toBe(false);
    expect(player.hasDecided).toBe(false);
    expect(player.isConnected).toBe(true);
  });
});

describe('generateRoomId', () => {
  it('6文字のIDが生成される', () => {
    const roomId = generateRoomId();
    expect(roomId.length).toBe(6);
  });

  it('許可された文字のみが使用される', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const roomId = generateRoomId();
    for (const char of roomId) {
      expect(allowedChars).toContain(char);
    }
  });

  it('紛らわしい文字が含まれない', () => {
    const roomId = generateRoomId();
    // I, O, 0, 1 は含まれない
    expect(roomId).not.toMatch(/[IO01]/);
  });
});

describe('getRankFromWords', () => {
  it('役なし: 空の配列', () => {
    const result = getRankFromWords([]);
    expect(result).toEqual({ rank: '役なし', score: 0 });
  });

  it('ファイブカード: 5文字の言葉', () => {
    const words: Word[] = [{ word: 'しりとり', indices: [0, 1, 2, 3, 4], length: 5 }];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'ファイブカード', score: 100 });
  });

  it('フォーカード: 4文字の言葉', () => {
    const words: Word[] = [{ word: 'さかな', indices: [0, 1, 2, 3], length: 4 }];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'フォーカード', score: 80 });
  });

  it('フルハウス: 3文字 + 2文字の言葉', () => {
    const words: Word[] = [
      { word: 'さかな', indices: [0, 1, 2], length: 3 },
      { word: 'いて', indices: [3, 4], length: 2 },
    ];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'フルハウス', score: 70 });
  });

  it('スリーカード: 3文字の言葉のみ', () => {
    const words: Word[] = [{ word: 'さかな', indices: [0, 1, 2], length: 3 }];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'スリーカード', score: 50 });
  });

  it('ツーペア: 2文字 × 2の言葉', () => {
    const words: Word[] = [
      { word: 'いて', indices: [0, 1], length: 2 },
      { word: 'かな', indices: [2, 3], length: 2 },
    ];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'ツーペア', score: 40 });
  });

  it('ワンペア: 2文字の言葉のみ', () => {
    const words: Word[] = [{ word: 'いて', indices: [0, 1], length: 2 }];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: 'ワンペア', score: 20 });
  });

  it('役なし: 1文字の言葉のみ', () => {
    const words: Word[] = [{ word: 'あ', indices: [0], length: 1 }];
    const result = getRankFromWords(words);
    expect(result).toEqual({ rank: '役なし', score: 0 });
  });
});

describe('sortWordsByRank', () => {
  it('長さの降順でソートされる', () => {
    const words: Word[] = [
      { word: 'いて', indices: [0, 1], length: 2 },
      { word: 'さかない', indices: [0, 1, 2, 3], length: 4 },
      { word: 'さかな', indices: [0, 1, 2], length: 3 },
    ];
    const sorted = sortWordsByRank(words);
    expect(sorted[0].length).toBe(4);
    expect(sorted[1].length).toBe(3);
    expect(sorted[2].length).toBe(2);
  });

  it('元の配列を変更しない', () => {
    const words: Word[] = [
      { word: 'いて', indices: [0, 1], length: 2 },
      { word: 'さかな', indices: [0, 1, 2], length: 3 },
    ];
    const original = [...words];
    sortWordsByRank(words);
    expect(words).toEqual(original);
  });
});

describe('getVoteResult', () => {
  it('good多数で approved', () => {
    const votes = { p1: 'good' as const, p2: 'good' as const, p3: 'bad' as const };
    expect(getVoteResult(votes)).toBe('approved');
  });

  it('bad多数で rejected', () => {
    const votes = { p1: 'good' as const, p2: 'bad' as const, p3: 'bad' as const };
    expect(getVoteResult(votes)).toBe('rejected');
  });

  it('同数で tie', () => {
    const votes = { p1: 'good' as const, p2: 'bad' as const };
    expect(getVoteResult(votes)).toBe('tie');
  });

  it('空の投票で tie', () => {
    const votes = {};
    expect(getVoteResult(votes)).toBe('tie');
  });
});

describe('calculateRankings', () => {
  it('スコア順にランキングが作成される', () => {
    const room: Room = {
      roomId: 'TEST01',
      maxPlayers: 3,
      players: [
        {
          playerId: 'p1',
          name: 'たろう',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [{ word: 'さかな', indices: [0, 1, 2], length: 3 }],
          score: 50,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
        {
          playerId: 'p2',
          name: 'はなこ',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [{ word: 'しりとり', indices: [0, 1, 2, 3, 4], length: 5 }],
          score: 100,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
        {
          playerId: 'p3',
          name: 'けんじ',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [],
          score: 0,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
      ],
      gameState: 'result',
      deck: [],
      turnOrder: ['p1', 'p2', 'p3'],
      currentJudgePlayerIndex: 0,
      currentJudgeWordIndex: 0,
      votes: {},
      restartVotes: {},
    };

    const rankings = calculateRankings(room);

    expect(rankings.length).toBe(3);
    expect(rankings[0].playerName).toBe('はなこ');
    expect(rankings[0].rank).toBe(1);
    expect(rankings[0].score).toBe(100);
    expect(rankings[1].playerName).toBe('たろう');
    expect(rankings[1].rank).toBe(2);
    expect(rankings[2].playerName).toBe('けんじ');
    expect(rankings[2].rank).toBe(3);
  });

  it('同スコアは同順位になる', () => {
    const room: Room = {
      roomId: 'TEST01',
      maxPlayers: 2,
      players: [
        {
          playerId: 'p1',
          name: 'たろう',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [{ word: 'さかな', indices: [0, 1, 2], length: 3 }],
          score: 50,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
        {
          playerId: 'p2',
          name: 'はなこ',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [{ word: 'いるか', indices: [0, 1, 2], length: 3 }],
          score: 50,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
      ],
      gameState: 'result',
      deck: [],
      turnOrder: ['p1', 'p2'],
      currentJudgePlayerIndex: 0,
      currentJudgeWordIndex: 0,
      votes: {},
      restartVotes: {},
    };

    const rankings = calculateRankings(room);

    expect(rankings[0].rank).toBe(1);
    expect(rankings[1].rank).toBe(1);
  });

  it('切断したプレイヤーは除外される', () => {
    const room: Room = {
      roomId: 'TEST01',
      maxPlayers: 2,
      players: [
        {
          playerId: 'p1',
          name: 'たろう',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [],
          score: 50,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: true,
        },
        {
          playerId: 'p2',
          name: 'はなこ',
          hand: [],
          selectedForExchange: [],
          arrangedHand: [],
          registeredWords: [],
          score: 100,
          hasExchanged: true,
          hasArranged: true,
          hasDecided: true,
          isConnected: false, // 切断
        },
      ],
      gameState: 'result',
      deck: [],
      turnOrder: ['p1', 'p2'],
      currentJudgePlayerIndex: 0,
      currentJudgeWordIndex: 0,
      votes: {},
      restartVotes: {},
    };

    const rankings = calculateRankings(room);

    expect(rankings.length).toBe(1);
    expect(rankings[0].playerName).toBe('たろう');
  });
});
