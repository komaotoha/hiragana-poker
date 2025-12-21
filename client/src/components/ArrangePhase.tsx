import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useGame } from '../contexts/GameContext';
import { SortableCard } from './SortableCard';
import '../styles/ArrangePhase.css';

export function ArrangePhase() {
  const {
    arrangedHand,
    setArrangedHand,
    submitArrange,
    arrangeSubmitted,
    playerId,
  } = useGame();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasSubmitted = playerId ? arrangeSubmitted.has(playerId) : false;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = arrangedHand.findIndex((_, i) => `card-${i}` === active.id);
      const newIndex = arrangedHand.findIndex((_, i) => `card-${i}` === over.id);

      setArrangedHand(arrayMove(arrangedHand, oldIndex, newIndex));
    }
  }, [arrangedHand, setArrangedHand]);

  const handleSubmit = () => {
    submitArrange(arrangedHand);
    setIsSubmitted(true);
  };

  if (hasSubmitted || isSubmitted) {
    return (
      <div className="arrange-phase">
        <p className="message">他のプレイヤーを待っています...</p>
        <div className="hand">
          {arrangedHand.map((char, index) => (
            <div key={index} className="card disabled">
              <span className="character">{char}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="arrange-phase">
      <p className="message">カードを並び替えてください（ドラッグで移動）</p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={arrangedHand.map((_, i) => `card-${i}`)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="hand sortable">
            {arrangedHand.map((char, index) => (
              <SortableCard
                key={`card-${index}`}
                id={`card-${index}`}
                character={char}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="action-area">
        <button className="btn primary" onClick={handleSubmit}>
          並び順を確定
        </button>
      </div>
    </div>
  );
}
