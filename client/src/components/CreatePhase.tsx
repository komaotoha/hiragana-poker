import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Card } from './Card';
import type { Word } from '../types';
import '../styles/CreatePhase.css';

export function CreatePhase() {
  const {
    arrangedHand,
    registeredWords,
    setRegisteredWords,
    submitWords,
    wordsSubmitted,
    playerId,
  } = useGame();

  const [selectedRange, setSelectedRange] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const hasSubmitted = playerId ? wordsSubmitted.has(playerId) : false;

  const toggleSelect = (index: number) => {
    if (isSubmitted || hasSubmitted) return;

    if (selectedRange.length === 0) {
      setSelectedRange([index]);
    } else if (selectedRange.length === 1) {
      const start = Math.min(selectedRange[0], index);
      const end = Math.max(selectedRange[0], index);
      const range = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      setSelectedRange(range);
    } else {
      // リセット
      setSelectedRange([index]);
    }
  };

  const registerWord = () => {
    if (selectedRange.length < 2) return;

    const sortedRange = [...selectedRange].sort((a, b) => a - b);
    const word = sortedRange.map(i => arrangedHand[i]).join('');
    const newWord: Word = {
      word,
      indices: sortedRange,
      length: sortedRange.length,
    };

    // 重複チェック
    const isDuplicate = registeredWords.some(w => w.word === newWord.word);
    if (!isDuplicate) {
      setRegisteredWords([...registeredWords, newWord]);
    }
    setSelectedRange([]);
  };

  const removeWord = (index: number) => {
    setRegisteredWords(registeredWords.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    submitWords(registeredWords);
    setIsSubmitted(true);
  };

  const getRankName = (length: number): string => {
    if (length === 5) return 'ファイブカード';
    if (length === 4) return 'フォーカード';
    if (length === 3) return 'スリーカード';
    if (length === 2) return 'ワンペア';
    return '';
  };

  if (hasSubmitted || isSubmitted) {
    return (
      <div className="create-phase">
        <p className="message">他のプレイヤーを待っています...</p>
        <div className="hand">
          {arrangedHand.map((char, index) => (
            <Card key={index} character={char} disabled />
          ))}
        </div>
        <div className="registered-words">
          <h3>登録した役</h3>
          {registeredWords.map((w, i) => (
            <div key={i} className="word-item">
              「{w.word}」 ({getRankName(w.length)})
            </div>
          ))}
          {registeredWords.length === 0 && <p>役なし</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="create-phase">
      <p className="message">連続するカードを選んで役を登録してください</p>

      <div className="hand">
        {arrangedHand.map((char, index) => (
          <Card
            key={index}
            character={char}
            selected={selectedRange.includes(index)}
            onClick={() => toggleSelect(index)}
          />
        ))}
      </div>

      <div className="selection-area">
        {selectedRange.length >= 2 && (
          <div className="preview">
            <span className="preview-word">
              {[...selectedRange].sort((a, b) => a - b).map(i => arrangedHand[i]).join('')}
            </span>
            <button className="btn small primary" onClick={registerWord}>
              登録
            </button>
          </div>
        )}
      </div>

      <div className="registered-words">
        <h3>登録した役</h3>
        {registeredWords.map((w, i) => (
          <div key={i} className="word-item">
            <span>「{w.word}」 ({getRankName(w.length)})</span>
            <button className="btn-remove" onClick={() => removeWord(i)}>×</button>
          </div>
        ))}
        {registeredWords.length === 0 && <p className="no-words">まだ登録されていません</p>}
      </div>

      <div className="action-area">
        <button className="btn primary" onClick={handleSubmit}>
          決定
        </button>
      </div>
    </div>
  );
}
