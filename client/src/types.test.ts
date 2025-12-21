import { describe, it, expect } from 'vitest';
import { HIRAGANA_CARDS, RANKS } from './types';

describe('HIRAGANA_CARDS', () => {
  it('47文字が含まれる', () => {
    expect(HIRAGANA_CARDS.length).toBe(47);
  });

  it('あ行が含まれる', () => {
    expect(HIRAGANA_CARDS).toContain('あ');
    expect(HIRAGANA_CARDS).toContain('い');
    expect(HIRAGANA_CARDS).toContain('う');
    expect(HIRAGANA_CARDS).toContain('え');
    expect(HIRAGANA_CARDS).toContain('お');
  });

  it('か行が含まれる', () => {
    expect(HIRAGANA_CARDS).toContain('か');
    expect(HIRAGANA_CARDS).toContain('き');
    expect(HIRAGANA_CARDS).toContain('く');
    expect(HIRAGANA_CARDS).toContain('け');
    expect(HIRAGANA_CARDS).toContain('こ');
  });

  it('伸ばし棒が含まれる', () => {
    expect(HIRAGANA_CARDS).toContain('ー');
  });

  it('「ん」が含まれる', () => {
    expect(HIRAGANA_CARDS).toContain('ん');
  });
});

describe('RANKS', () => {
  it('7つの役が定義されている', () => {
    const rankNames = Object.keys(RANKS);
    expect(rankNames.length).toBe(7);
  });

  it('ファイブカードが100点', () => {
    expect(RANKS['ファイブカード'].score).toBe(100);
  });

  it('フォーカードが80点', () => {
    expect(RANKS['フォーカード'].score).toBe(80);
  });

  it('フルハウスが70点', () => {
    expect(RANKS['フルハウス'].score).toBe(70);
  });

  it('スリーカードが50点', () => {
    expect(RANKS['スリーカード'].score).toBe(50);
  });

  it('ツーペアが40点', () => {
    expect(RANKS['ツーペア'].score).toBe(40);
  });

  it('ワンペアが20点', () => {
    expect(RANKS['ワンペア'].score).toBe(20);
  });

  it('役なしが0点', () => {
    expect(RANKS['役なし'].score).toBe(0);
  });
});
