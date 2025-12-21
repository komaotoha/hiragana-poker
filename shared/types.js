"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RANKS = exports.HIRAGANA_CARDS = void 0;
// ひらがなカード一覧
exports.HIRAGANA_CARDS = [
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
];
exports.RANKS = {
    'ファイブカード': { name: 'ファイブカード', score: 100, description: '5文字の言葉' },
    'フォーカード': { name: 'フォーカード', score: 80, description: '4文字の言葉' },
    'フルハウス': { name: 'フルハウス', score: 70, description: '3文字＋2文字の言葉' },
    'スリーカード': { name: 'スリーカード', score: 50, description: '3文字の言葉' },
    'ツーペア': { name: 'ツーペア', score: 40, description: '2文字×2の言葉' },
    'ワンペア': { name: 'ワンペア', score: 20, description: '2文字の言葉' },
    '役なし': { name: '役なし', score: 0, description: '言葉が作れない' },
};
