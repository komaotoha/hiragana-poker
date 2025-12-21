import '../styles/Card.css';

interface CardProps {
  character: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
}

export function Card({ character, selected, onClick, disabled, highlighted }: CardProps) {
  return (
    <div
      className={`card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${highlighted ? 'highlighted' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <span className="character">{character}</span>
    </div>
  );
}
