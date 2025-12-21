import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { Card } from './Card';
import '../styles/ExchangePhase.css';

export function ExchangePhase() {
  const {
    hand,
    selectedForExchange,
    setSelectedForExchange,
    submitExchange,
    exchangeSubmitted,
    playerId,
  } = useGame();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const hasSubmitted = playerId ? exchangeSubmitted.has(playerId) : false;

  const toggleSelect = (index: number) => {
    if (isSubmitted || hasSubmitted) return;

    if (selectedForExchange.includes(index)) {
      setSelectedForExchange(selectedForExchange.filter(i => i !== index));
    } else {
      setSelectedForExchange([...selectedForExchange, index]);
    }
  };

  const handleSubmit = () => {
    submitExchange(selectedForExchange);
    setIsSubmitted(true);
  };

  if (hasSubmitted || isSubmitted) {
    return (
      <div className="exchange-phase">
        <p className="message">他のプレイヤーの選択を待っています...</p>
        <div className="hand">
          {hand.map((char, index) => (
            <Card
              key={index}
              character={char}
              selected={selectedForExchange.includes(index)}
              disabled
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-phase">
      <p className="message">交換するカードを選んでください</p>

      <div className="hand">
        {hand.map((char, index) => (
          <Card
            key={index}
            character={char}
            selected={selectedForExchange.includes(index)}
            onClick={() => toggleSelect(index)}
          />
        ))}
      </div>

      <div className="action-area">
        {selectedForExchange.length === 0 ? (
          <button className="btn secondary" onClick={handleSubmit}>
            交換しない
          </button>
        ) : (
          <button className="btn primary" onClick={handleSubmit}>
            {selectedForExchange.length}枚交換する
          </button>
        )}
      </div>
    </div>
  );
}
