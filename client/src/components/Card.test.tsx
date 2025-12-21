import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('ひらがなが表示される', () => {
    render(<Card character="あ" />);
    expect(screen.getByText('あ')).toBeInTheDocument();
  });

  it('クリックでonClickが呼ばれる', () => {
    const handleClick = vi.fn();
    render(<Card character="い" onClick={handleClick} />);

    fireEvent.click(screen.getByText('い'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('selectedがtrueの時、selectedクラスが付与される', () => {
    render(<Card character="う" selected />);
    const card = screen.getByText('う').closest('.card');
    expect(card).toHaveClass('selected');
  });

  it('disabledがtrueの時、disabledクラスが付与される', () => {
    render(<Card character="え" disabled />);
    const card = screen.getByText('え').closest('.card');
    expect(card).toHaveClass('disabled');
  });

  it('disabledがtrueの時、クリックしてもonClickが呼ばれない', () => {
    const handleClick = vi.fn();
    render(<Card character="お" disabled onClick={handleClick} />);

    fireEvent.click(screen.getByText('お'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('highlightedがtrueの時、highlightedクラスが付与される', () => {
    render(<Card character="か" highlighted />);
    const card = screen.getByText('か').closest('.card');
    expect(card).toHaveClass('highlighted');
  });
});
