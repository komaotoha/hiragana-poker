import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSocket } from './SocketContext';
import type { Player, GamePhase, Word, Ranking, RankName } from '../types';

interface GameState {
  roomId: string | null;
  playerId: string | null;
  players: Player[];
  phase: GamePhase;
  hand: string[];
  arrangedHand: string[];
  turnOrder: string[];

  // 交換フェーズ
  selectedForExchange: number[];
  exchangeSubmitted: Set<string>;

  // 役作成フェーズ
  registeredWords: Word[];
  arrangeSubmitted: Set<string>;
  wordsSubmitted: Set<string>;

  // 判定フェーズ
  currentJudgePlayer: { playerId: string; playerName: string; words: Word[] } | null;
  currentWord: { word: Word; rank: RankName } | null;
  votes: Record<string, 'good' | 'bad'>;
  votedPlayers: Set<string>;
  voteResult: { votes: Record<string, 'good' | 'bad'>; result: 'approved' | 'rejected' | 'tie' } | null;
  playerResult: { playerId: string; approvedWord: Word | null; score: number } | null;

  // 結果
  rankings: Ranking[];
  restartVotes: Record<string, boolean>;

  // エラー
  error: { code: string; message: string } | null;
}

interface GameContextType extends GameState {
  createRoom: (maxPlayers: number) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  submitExchange: (selectedIndices: number[]) => void;
  submitArrange: (arrangedHand: string[]) => void;
  submitWords: (words: Word[]) => void;
  vote: (vote: 'good' | 'bad') => void;
  revote: () => void;
  requestRestart: () => void;

  setSelectedForExchange: (indices: number[]) => void;
  setArrangedHand: (hand: string[]) => void;
  setRegisteredWords: (words: Word[]) => void;
  clearError: () => void;
}

const initialState: GameState = {
  roomId: null,
  playerId: null,
  players: [],
  phase: 'waiting',
  hand: [],
  arrangedHand: [],
  turnOrder: [],
  selectedForExchange: [],
  exchangeSubmitted: new Set(),
  registeredWords: [],
  arrangeSubmitted: new Set(),
  wordsSubmitted: new Set(),
  currentJudgePlayer: null,
  currentWord: null,
  votes: {},
  votedPlayers: new Set(),
  voteResult: null,
  playerResult: null,
  rankings: [],
  restartVotes: {},
  error: null,
};

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { socket } = useSocket();
  const [state, setState] = useState<GameState>(initialState);

  useEffect(() => {
    if (!socket) return;

    // ルーム関連
    socket.on('room:created', ({ roomId }) => {
      setState(prev => ({ ...prev, roomId }));
    });

    socket.on('room:joined', ({ playerId, players }) => {
      setState(prev => ({ ...prev, playerId, players }));
    });

    socket.on('room:player_joined', ({ players }) => {
      setState(prev => ({ ...prev, players }));
    });

    socket.on('room:player_left', ({ players }) => {
      setState(prev => ({ ...prev, players }));
    });

    socket.on('room:error', (error) => {
      setState(prev => ({ ...prev, error }));
    });

    // ゲーム進行
    socket.on('game:start', ({ turnOrder, hands }) => {
      const myHand = hands[socket.id || ''] || [];
      setState(prev => ({
        ...prev,
        turnOrder,
        hand: myHand,
        arrangedHand: [...myHand],
        phase: 'exchange',
        exchangeSubmitted: new Set(),
        arrangeSubmitted: new Set(),
        wordsSubmitted: new Set(),
        registeredWords: [],
        selectedForExchange: [],
      }));
    });

    socket.on('game:phase_change', ({ phase }) => {
      setState(prev => ({ ...prev, phase }));
    });

    // 交換フェーズ
    socket.on('exchange:submitted', ({ playerId }) => {
      setState(prev => ({
        ...prev,
        exchangeSubmitted: new Set([...prev.exchangeSubmitted, playerId]),
      }));
    });

    socket.on('exchange:complete', ({ hands }) => {
      const myHand = hands[socket.id || ''] || [];
      setState(prev => ({
        ...prev,
        hand: myHand,
        arrangedHand: [...myHand],
        selectedForExchange: [],
      }));
    });

    // 役作成フェーズ
    socket.on('arrange:submitted', ({ playerId }) => {
      setState(prev => ({
        ...prev,
        arrangeSubmitted: new Set([...prev.arrangeSubmitted, playerId]),
      }));
    });

    socket.on('words:submitted', ({ playerId }) => {
      setState(prev => ({
        ...prev,
        wordsSubmitted: new Set([...prev.wordsSubmitted, playerId]),
      }));
    });

    socket.on('create:complete', () => {
      // 判定フェーズへ
    });

    // 判定フェーズ
    socket.on('judge:start_player', (data) => {
      setState(prev => ({
        ...prev,
        currentJudgePlayer: data,
        currentWord: null,
        votes: {},
        votedPlayers: new Set(),
        voteResult: null,
        playerResult: null,
      }));
    });

    socket.on('judge:show_word', (data) => {
      setState(prev => ({
        ...prev,
        currentWord: data,
        votes: {},
        votedPlayers: new Set(),
        voteResult: null,
      }));
    });

    socket.on('judge:voted', ({ playerId }) => {
      setState(prev => ({
        ...prev,
        votedPlayers: new Set([...prev.votedPlayers, playerId]),
      }));
    });

    socket.on('judge:vote_result', (data) => {
      setState(prev => ({
        ...prev,
        voteResult: data,
        votes: data.votes,
      }));
    });

    socket.on('judge:player_result', (data) => {
      setState(prev => ({
        ...prev,
        playerResult: data,
        players: prev.players.map(p =>
          p.playerId === data.playerId ? { ...p, score: data.score } : p
        ),
      }));
    });

    socket.on('judge:complete', () => {
      setState(prev => ({
        ...prev,
        currentJudgePlayer: null,
        currentWord: null,
      }));
    });

    // 結果
    socket.on('result:show', ({ rankings }) => {
      setState(prev => ({ ...prev, rankings }));
    });

    socket.on('result:restart_vote', ({ votes }) => {
      setState(prev => ({ ...prev, restartVotes: votes }));
    });

    socket.on('result:restarting', () => {
      setState(prev => ({
        ...prev,
        phase: 'waiting',
        rankings: [],
        restartVotes: {},
      }));
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:error');
      socket.off('game:start');
      socket.off('game:phase_change');
      socket.off('exchange:submitted');
      socket.off('exchange:complete');
      socket.off('arrange:submitted');
      socket.off('words:submitted');
      socket.off('create:complete');
      socket.off('judge:start_player');
      socket.off('judge:show_word');
      socket.off('judge:voted');
      socket.off('judge:vote_result');
      socket.off('judge:player_result');
      socket.off('judge:complete');
      socket.off('result:show');
      socket.off('result:restart_vote');
      socket.off('result:restarting');
    };
  }, [socket]);

  const createRoom = useCallback((maxPlayers: number) => {
    socket?.emit('room:create', { maxPlayers });
  }, [socket]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    setState(prev => ({ ...prev, roomId }));
    socket?.emit('room:join', { roomId, playerName });
  }, [socket]);

  const submitExchange = useCallback((selectedIndices: number[]) => {
    socket?.emit('exchange:submit', { selectedIndices });
  }, [socket]);

  const submitArrange = useCallback((arrangedHand: string[]) => {
    socket?.emit('arrange:submit', { arrangedHand });
  }, [socket]);

  const submitWords = useCallback((words: Word[]) => {
    socket?.emit('words:submit', { words });
  }, [socket]);

  const vote = useCallback((v: 'good' | 'bad') => {
    socket?.emit('judge:vote', { vote: v });
  }, [socket]);

  const revote = useCallback(() => {
    socket?.emit('judge:revote', {});
  }, [socket]);

  const requestRestart = useCallback(() => {
    socket?.emit('result:restart', {});
  }, [socket]);

  const setSelectedForExchange = useCallback((indices: number[]) => {
    setState(prev => ({ ...prev, selectedForExchange: indices }));
  }, []);

  const setArrangedHand = useCallback((hand: string[]) => {
    setState(prev => ({ ...prev, arrangedHand: hand }));
  }, []);

  const setRegisteredWords = useCallback((words: Word[]) => {
    setState(prev => ({ ...prev, registeredWords: words }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value: GameContextType = {
    ...state,
    createRoom,
    joinRoom,
    submitExchange,
    submitArrange,
    submitWords,
    vote,
    revote,
    requestRestart,
    setSelectedForExchange,
    setArrangedHand,
    setRegisteredWords,
    clearError,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
