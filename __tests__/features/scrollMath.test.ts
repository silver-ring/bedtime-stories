import {
  offsetForFraction,
  scrollFraction,
} from '../../src/features/reader/scrollMath';

describe('scroll math', () => {
  it('C7: fraction is offset divided by the scrollable length', () => {
    expect(scrollFraction(300, 1000, 400)).toBeCloseTo(0.5);
    expect(scrollFraction(0, 1000, 400)).toBe(0);
    expect(scrollFraction(600, 1000, 400)).toBe(1);
  });

  it('C7: overscroll is clamped', () => {
    expect(scrollFraction(-50, 1000, 400)).toBe(0);
    expect(scrollFraction(900, 1000, 400)).toBe(1);
  });

  it('C7: content that fits on screen counts as fully read', () => {
    expect(scrollFraction(0, 300, 400)).toBe(1);
    expect(scrollFraction(0, 400, 400)).toBe(1);
    expect(scrollFraction(0, 0, 0)).toBe(1);
  });

  it('offset round-trips with fraction, and a short page restores to 0', () => {
    const offset = offsetForFraction(0.25, 2000, 500);
    expect(offset).toBe(375);
    expect(scrollFraction(offset, 2000, 500)).toBeCloseTo(0.25);
    expect(offsetForFraction(0.8, 300, 500)).toBe(0);
    expect(offsetForFraction(5, 2000, 500)).toBe(1500);
  });
});
