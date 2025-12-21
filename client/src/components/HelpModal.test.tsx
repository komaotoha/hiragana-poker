import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpModal, HelpButton } from './HelpModal';

describe('HelpModal', () => {
  it('isOpenがfalseの時、何も表示されない', () => {
    render(<HelpModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('ルール')).not.toBeInTheDocument();
  });

  it('isOpenがtrueの時、モーダルが表示される', () => {
    render(<HelpModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('ルール')).toBeInTheDocument();
    expect(screen.getByText('遊び方')).toBeInTheDocument();
    expect(screen.getByText('役一覧')).toBeInTheDocument();
  });

  it('デフォルトでルールタブが表示される', () => {
    render(<HelpModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('【ひらがな作文ポーカーとは】')).toBeInTheDocument();
  });

  it('遊び方タブをクリックすると内容が切り替わる', () => {
    render(<HelpModal isOpen={true} onClose={() => {}} />);

    fireEvent.click(screen.getByText('遊び方'));
    expect(screen.getByText('【ゲームの流れ】')).toBeInTheDocument();
  });

  it('役一覧タブをクリックすると役の表が表示される', () => {
    render(<HelpModal isOpen={true} onClose={() => {}} />);

    fireEvent.click(screen.getByText('役一覧'));
    expect(screen.getByText('ファイブカード')).toBeInTheDocument();
    expect(screen.getByText('フォーカード')).toBeInTheDocument();
    expect(screen.getByText('フルハウス')).toBeInTheDocument();
  });

  it('×ボタンをクリックするとonCloseが呼ばれる', () => {
    const handleClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByText('×'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('オーバーレイをクリックするとonCloseが呼ばれる', () => {
    const handleClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={handleClose} />);

    // modal-overlayをクリック
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('モーダル内部をクリックしてもonCloseは呼ばれない', () => {
    const handleClose = vi.fn();
    render(<HelpModal isOpen={true} onClose={handleClose} />);

    // modal-contentをクリック
    const content = document.querySelector('.modal-content');
    if (content) {
      fireEvent.click(content);
    }
    expect(handleClose).not.toHaveBeenCalled();
  });
});

describe('HelpButton', () => {
  it('?ボタンが表示される', () => {
    render(<HelpButton />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('ボタンをクリックするとモーダルが開く', () => {
    render(<HelpButton />);

    expect(screen.queryByText('【ひらがな作文ポーカーとは】')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('?'));

    expect(screen.getByText('【ひらがな作文ポーカーとは】')).toBeInTheDocument();
  });
});
