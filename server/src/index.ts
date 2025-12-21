import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Room,
  Player,
  Word,
  HIRAGANA_CARDS,
  GamePhase,
  RankName,
  Ranking,
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ルーム管理
const rooms = new Map<string, Room>();
const playerRooms = new Map<string, string>(); // socketId -> roomId

// ユーティリティ関数
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createDeck(): string[] {
  // 各ひらがなを2枚ずつ入れる（94枚）
  const deck: string[] = [];
  HIRAGANA_CARDS.forEach(card => {
    deck.push(card, card);
  });
  return shuffleArray(deck);
}

function dealCards(deck: string[], count: number): string[] {
  return deck.splice(0, count);
}

function createPlayer(playerId: string, name: string): Player {
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

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRankFromWords(words: Word[]): { rank: RankName; score: number } {
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

function sortWordsByRank(words: Word[]): Word[] {
  return [...words].sort((a, b) => b.length - a.length);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // ルーム作成
  socket.on('room:create', ({ maxPlayers }) => {
    const roomId = generateRoomId();
    const room: Room = {
      roomId,
      maxPlayers,
      players: [],
      gameState: 'waiting',
      deck: createDeck(),
      turnOrder: [],
      currentJudgePlayerIndex: 0,
      currentJudgeWordIndex: 0,
      votes: {},
      restartVotes: {},
    };
    rooms.set(roomId, room);
    socket.emit('room:created', { roomId, roomUrl: `/room/${roomId}` });
    console.log('Room created:', roomId);
  });

  // ルーム参加
  socket.on('room:join', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);

    if (!room) {
      socket.emit('room:error', { code: 'ROOM_NOT_FOUND', message: 'ルームが見つかりません' });
      return;
    }

    if (room.gameState !== 'waiting') {
      socket.emit('room:error', { code: 'ROOM_ALREADY_STARTED', message: 'ゲームは既に開始しています' });
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit('room:error', { code: 'ROOM_FULL', message: '満員です' });
      return;
    }

    const player = createPlayer(socket.id, playerName);
    room.players.push(player);
    playerRooms.set(socket.id, roomId);

    socket.join(roomId);

    socket.emit('room:joined', {
      playerId: socket.id,
      players: room.players,
    });

    socket.to(roomId).emit('room:player_joined', {
      player,
      players: room.players,
    });

    console.log(`Player ${playerName} joined room ${roomId}`);

    // 全員揃ったらゲーム開始
    if (room.players.length === room.maxPlayers) {
      startGame(room);
    }
  });

  // カード交換
  socket.on('exchange:submit', ({ selectedIndices }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'exchange') return;

    const player = room.players.find(p => p.playerId === socket.id);
    if (!player || player.hasExchanged) return;

    player.selectedForExchange = selectedIndices;
    player.hasExchanged = true;

    io.to(roomId).emit('exchange:submitted', { playerId: socket.id });

    // 全員が交換を完了したか確認
    const allExchanged = room.players.every(p => p.hasExchanged || !p.isConnected);
    if (allExchanged) {
      processExchange(room);
    }
  });

  // 並び順確定
  socket.on('arrange:submit', ({ arrangedHand }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'arrange') return;

    const player = room.players.find(p => p.playerId === socket.id);
    if (!player || player.hasArranged) return;

    player.arrangedHand = arrangedHand;
    player.hasArranged = true;

    io.to(roomId).emit('arrange:submitted', { playerId: socket.id });

    // 全員が並び順を確定したか確認
    const allArranged = room.players.every(p => p.hasArranged || !p.isConnected);
    if (allArranged) {
      room.gameState = 'create';
      io.to(roomId).emit('game:phase_change', { phase: 'create' });
    }
  });

  // 役登録
  socket.on('words:submit', ({ words }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'create') return;

    const player = room.players.find(p => p.playerId === socket.id);
    if (!player || player.hasDecided) return;

    player.registeredWords = sortWordsByRank(words);
    player.hasDecided = true;

    io.to(roomId).emit('words:submitted', { playerId: socket.id });

    // 全員が役を決定したか確認
    const allDecided = room.players.every(p => p.hasDecided || !p.isConnected);
    if (allDecided) {
      io.to(roomId).emit('create:complete', {});
      startJudgePhase(room);
    }
  });

  // 投票
  socket.on('judge:vote', ({ vote }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'judge') return;

    const currentPlayer = room.players[room.currentJudgePlayerIndex];
    if (currentPlayer.playerId === socket.id) return; // 発表者は投票できない

    room.votes[socket.id] = vote;
    io.to(roomId).emit('judge:voted', { playerId: socket.id });

    // 全員が投票したか確認（発表者を除く）
    const voters = room.players.filter(p => p.playerId !== currentPlayer.playerId && p.isConnected);
    const allVoted = voters.every(p => room.votes[p.playerId]);

    if (allVoted) {
      processVoteResult(room);
    }
  });

  // 再投票
  socket.on('judge:revote', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'judge') return;

    // 投票をリセットして再投票
    room.votes = {};
    const currentPlayer = room.players[room.currentJudgePlayerIndex];
    const currentWord = currentPlayer.registeredWords[room.currentJudgeWordIndex];
    const rankInfo = getRankFromWords([currentWord]);

    io.to(roomId).emit('judge:show_word', {
      word: currentWord,
      rank: rankInfo.rank,
    });
  });

  // 再戦
  socket.on('result:restart', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.gameState !== 'result') return;

    room.restartVotes[socket.id] = true;

    io.to(roomId).emit('result:restart_vote', { votes: room.restartVotes });

    // 全員が再戦に投票したか確認
    const allVoted = room.players.every(p => room.restartVotes[p.playerId] || !p.isConnected);
    if (allVoted) {
      restartGame(room);
    }
  });

  // 切断
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.playerId === socket.id);
    if (player) {
      player.isConnected = false;
    }

    if (room.gameState === 'waiting') {
      // 待機中は完全に削除
      room.players = room.players.filter(p => p.playerId !== socket.id);
      io.to(roomId).emit('room:player_left', {
        playerId: socket.id,
        players: room.players,
      });
    } else {
      // ゲーム中は離脱扱い
      io.to(roomId).emit('room:player_left', {
        playerId: socket.id,
        players: room.players,
      });

      // 残り1人になったらゲーム終了
      const connectedPlayers = room.players.filter(p => p.isConnected);
      if (connectedPlayers.length <= 1) {
        room.gameState = 'result';
        const rankings = calculateRankings(room);
        io.to(roomId).emit('result:show', { rankings });
      }
    }

    playerRooms.delete(socket.id);

    // 全員いなくなったらルーム削除
    if (room.players.filter(p => p.isConnected).length === 0) {
      rooms.delete(roomId);
      console.log('Room deleted:', roomId);
    }
  });
});

function startGame(room: Room) {
  // ターン順をランダムに決定
  room.turnOrder = shuffleArray(room.players.map(p => p.playerId));

  // カードを配る
  const hands: Record<string, string[]> = {};
  room.players.forEach(player => {
    player.hand = dealCards(room.deck, 5);
    hands[player.playerId] = player.hand;
  });

  room.gameState = 'exchange';

  io.to(room.roomId).emit('game:start', { turnOrder: room.turnOrder, hands });
  io.to(room.roomId).emit('game:phase_change', { phase: 'exchange' });

  console.log('Game started in room:', room.roomId);
}

function processExchange(room: Room) {
  // ターン順で交換を実行
  for (const playerId of room.turnOrder) {
    const player = room.players.find(p => p.playerId === playerId);
    if (!player || !player.isConnected) continue;

    const indicesToExchange = player.selectedForExchange;
    if (indicesToExchange.length > 0) {
      // 新しいカードを引く
      const newCards = dealCards(room.deck, indicesToExchange.length);
      // 交換対象のカードを置き換え
      indicesToExchange.forEach((index, i) => {
        player.hand[index] = newCards[i];
      });
    }
    player.selectedForExchange = [];
  }

  // 全員に新しい手札を通知
  const hands: Record<string, string[]> = {};
  room.players.forEach(player => {
    hands[player.playerId] = player.hand;
  });

  io.to(room.roomId).emit('exchange:complete', { hands });

  // 並び替えフェーズへ
  room.gameState = 'arrange';
  io.to(room.roomId).emit('game:phase_change', { phase: 'arrange' });
}

function startJudgePhase(room: Room) {
  room.gameState = 'judge';
  room.currentJudgePlayerIndex = 0;
  room.currentJudgeWordIndex = 0;
  room.votes = {};

  io.to(room.roomId).emit('game:phase_change', { phase: 'judge' });

  showNextJudge(room);
}

function showNextJudge(room: Room) {
  // 接続中のプレイヤーを探す
  while (room.currentJudgePlayerIndex < room.turnOrder.length) {
    const playerId = room.turnOrder[room.currentJudgePlayerIndex];
    const player = room.players.find(p => p.playerId === playerId);

    if (player && player.isConnected && player.registeredWords.length > 0) {
      break;
    }

    // 役がないか切断している場合はスキップ
    if (player) {
      player.score = 0;
      io.to(room.roomId).emit('judge:player_result', {
        playerId: player.playerId,
        approvedWord: null,
        score: 0,
      });
    }

    room.currentJudgePlayerIndex++;
  }

  if (room.currentJudgePlayerIndex >= room.turnOrder.length) {
    // 全員の判定終了
    endJudgePhase(room);
    return;
  }

  const playerId = room.turnOrder[room.currentJudgePlayerIndex];
  const player = room.players.find(p => p.playerId === playerId)!;

  room.currentJudgeWordIndex = 0;
  room.votes = {};

  io.to(room.roomId).emit('judge:start_player', {
    playerId: player.playerId,
    playerName: player.name,
    words: player.registeredWords,
  });

  showCurrentWord(room);
}

function showCurrentWord(room: Room) {
  const playerId = room.turnOrder[room.currentJudgePlayerIndex];
  const player = room.players.find(p => p.playerId === playerId)!;

  if (room.currentJudgeWordIndex >= player.registeredWords.length) {
    // 全ての役が却下された
    player.score = 0;
    io.to(room.roomId).emit('judge:player_result', {
      playerId: player.playerId,
      approvedWord: null,
      score: 0,
    });

    room.currentJudgePlayerIndex++;
    showNextJudge(room);
    return;
  }

  const word = player.registeredWords[room.currentJudgeWordIndex];
  const rankInfo = getRankFromWords([word]);

  room.votes = {};

  io.to(room.roomId).emit('judge:show_word', {
    word,
    rank: rankInfo.rank,
  });
}

function processVoteResult(room: Room) {
  const votes = room.votes;
  const goodCount = Object.values(votes).filter(v => v === 'good').length;
  const badCount = Object.values(votes).filter(v => v === 'bad').length;

  let result: 'approved' | 'rejected' | 'tie';
  if (goodCount > badCount) {
    result = 'approved';
  } else if (badCount > goodCount) {
    result = 'rejected';
  } else {
    result = 'tie';
  }

  io.to(room.roomId).emit('judge:vote_result', { votes, result });

  if (result === 'approved') {
    // 承認された
    const playerId = room.turnOrder[room.currentJudgePlayerIndex];
    const player = room.players.find(p => p.playerId === playerId)!;
    const word = player.registeredWords[room.currentJudgeWordIndex];
    const rankInfo = getRankFromWords([word]);

    player.score = rankInfo.score;

    setTimeout(() => {
      io.to(room.roomId).emit('judge:player_result', {
        playerId: player.playerId,
        approvedWord: word,
        score: rankInfo.score,
      });

      room.currentJudgePlayerIndex++;
      showNextJudge(room);
    }, 2500);
  } else if (result === 'rejected') {
    // 却下 - 次の役へ
    room.currentJudgeWordIndex++;
    setTimeout(() => {
      showCurrentWord(room);
    }, 1000);
  }
  // tie の場合は再投票ボタンを待つ
}

function endJudgePhase(room: Room) {
  io.to(room.roomId).emit('judge:complete', {});

  room.gameState = 'result';
  room.restartVotes = {};

  const rankings = calculateRankings(room);
  io.to(room.roomId).emit('game:phase_change', { phase: 'result' });
  io.to(room.roomId).emit('result:show', { rankings });
}

function calculateRankings(room: Room): Ranking[] {
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

function restartGame(room: Room) {
  // ゲーム状態をリセット
  room.deck = createDeck();
  room.gameState = 'waiting';
  room.currentJudgePlayerIndex = 0;
  room.currentJudgeWordIndex = 0;
  room.votes = {};
  room.restartVotes = {};

  room.players.forEach(player => {
    player.hand = [];
    player.selectedForExchange = [];
    player.arrangedHand = [];
    player.registeredWords = [];
    player.score = 0;
    player.hasExchanged = false;
    player.hasArranged = false;
    player.hasDecided = false;
  });

  io.to(room.roomId).emit('result:restarting', {});

  // 再度ゲーム開始
  startGame(room);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
