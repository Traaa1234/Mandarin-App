import { describe, expect, it } from 'vitest';
import { toneOf } from '../src/lib/tones';

describe('toneOf', () => {
  it('reads the tone mark', () => {
    expect(['mā', 'má', 'mǎ', 'mà', 'ma'].map(toneOf)).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles ü with a tone mark', () => {
    expect(toneOf('nǚ')).toBe(3);
    expect(toneOf('lǜ')).toBe(4);
  });
});
