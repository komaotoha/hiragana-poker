// ひらがなカード一覧
export const HIRAGANA_CARDS = [
  'あ', 'い', 'う', 'え', 'お',
  'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ',
  'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の',
  'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も',
  'や', 'ゆ', 'よ',
  'ら', 'り', 'る', 'れ', 'ろ',
  'わ', 'を', 'ん',
  'ー'
] as const;

export type HiraganaCard = typeof HIRAGANA_CARDS[number];

// ゲームフェーズ
export type GamePhase = 'waiting' | 'exchange' | 'arrange' | 'create' | 'judge' | 'result';

// 役の情報
export interface Word {
  word: string;
  indices: number[];
  length: number;
}

// 役のランク
export type RankName = 'ファイブカード' | 'フォーカード' | 'フルハウス' | 'スリーカード' | 'ツーペア' | 'ワンペア' | '役なし';

export interface RankInfo {
  name: RankName;
  score: number;
  description: string;
}

export const RANKS: Record<RankName, RankInfo> = {
  'ファイブカード': { name: 'ファイブカード', score: 100, description: '5文字の言葉' },
  'フォーカード': { name: 'フォーカード', score: 80, description: '4文字の言葉' },
  'フルハウス': { name: 'フルハウス', score: 70, description: '3文字＋2文字の言葉' },
  'スリーカード': { name: 'スリーカード', score: 50, description: '3文字の言葉' },
  'ツーペア': { name: 'ツーペア', score: 40, description: '2文字×2の言葉' },
  'ワンペア': { name: 'ワンペア', score: 20, description: '2文字の言葉' },
  '役なし': { name: '役なし', score: 0, description: '言葉が作れない' },
};

// プレイヤー情報
export interface Player {
  playerId: string;
  name: string;
  hand: string[];
  selectedForExchange: number[];
  arrangedHand: string[];
  registeredWords: Word[];
  score: number;
  hasExchanged: boolean;
  hasArranged: boolean;
  hasDecided: boolean;
  isConnected: boolean;
}

// ルーム情報
export interface Room {
  roomId: string;
  maxPlayers: number;
  players: Player[];
  gameState: GamePhase;
  deck: string[];
  turnOrder: string[];
  currentJudgePlayerIndex: number;
  currentJudgeWordIndex: number;
  votes: Record<string, 'good' | 'bad'>;
  restartVotes: Record<string, boolean>;
}

// ランキング情報
export interface Ranking {
  playerId: string;
  playerName: string;
  rank: number;
  score: number;
  approvedWord: Word | null;
}

// エラーコード
export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'INVALID_DATA'
  | 'NOT_YOUR_TURN'
  | 'CONNECTION_LOST';

// WebSocketイベント
export interface ServerToClientEvents {
  'room:created': (data: { roomId: string; roomUrl: string }) => void;
  'room:joined': (data: { playerId: string; players: Player[] }) => void;
  'room:player_joined': (data: { player: Player; players: Player[] }) => void;
  'room:player_left': (data: { playerId: string; players: Player[] }) => void;
  'room:error': (data: { code: ErrorCode; message: string }) => void;

  'game:start': (data: { turnOrder: string[]; hands: Record<string, string[]> }) => void;
  'game:phase_change': (data: { phase: GamePhase }) => void;

  'exchange:submitted': (data: { playerId: string }) => void;
  'exchange:complete': (data: { hands: Record<string, string[]> }) => void;

  'arrange:submitted': (data: { playerId: string }) => void;
  'words:submitted': (data: { playerId: string }) => void;
  'create:complete': (data: Record<string, never>) => void;

  'judge:start_player': (data: { playerId: string; playerName: string; words: Word[] }) => void;
  'judge:show_word': (data: { word: Word; rank: RankName }) => void;
  'judge:voted': (data: { playerId: string }) => void;
  'judge:vote_result': (data: { votes: Record<string, 'good' | 'bad'>; result: 'approved' | 'rejected' | 'tie' }) => void;
  'judge:player_result': (data: { playerId: string; approvedWord: Word | null; score: number }) => void;
  'judge:complete': (data: Record<string, never>) => void;

  'result:show': (data: { rankings: Ranking[] }) => void;
  'result:restart_vote': (data: { votes: Record<string, boolean> }) => void;
  'result:restarting': (data: Record<string, never>) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { maxPlayers: number }) => void;
  'room:join': (data: { roomId: string; playerName: string }) => void;

  'exchange:submit': (data: { selectedIndices: number[] }) => void;

  'arrange:submit': (data: { arrangedHand: string[] }) => void;
  'words:submit': (data: { words: Word[] }) => void;

  'judge:vote': (data: { vote: 'good' | 'bad' }) => void;
  'judge:revote': (data: Record<string, never>) => void;

  'result:restart': (data: Record<string, never>) => void;
}
