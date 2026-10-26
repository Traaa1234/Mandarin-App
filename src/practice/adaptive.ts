import type { Outcome } from './rating';
import { FAST_MS } from './rating';

export type Level = 'easier' | 'normal' | 'harder';

// Aim for about 80% success. After 2 misses in a row, offer an easier version
// (fewer choices, outline shown); after 5 quick right answers in a row, raise
// the challenge. One normal answer brings an easier level back to normal.
export interface AdaptState {
  level: Level;
  misses: number;
  quick: number;
}

export const START: AdaptState = { level: 'normal', misses: 0, quick: 0 };

export function adapt(state: AdaptState, o: Outcome): AdaptState {
  const missed = o.helped || o.retries > 0 || (o.writeMistakes ?? 0) > 3;
  if (missed) {
    const misses = state.misses + 1;
    return { level: misses >= 2 ? 'easier' : state.level === 'harder' ? 'normal' : state.level, misses, quick: 0 };
  }
  const quick = o.ms < FAST_MS && o.retries === 0 && (o.writeMistakes ?? 0) === 0 ? state.quick + 1 : 0;
  return { level: quick >= 5 ? 'harder' : state.level === 'easier' ? 'normal' : state.level, misses: 0, quick: quick >= 5 ? 0 : quick };
}

export const CHOICES: Record<Level, number> = { easier: 2, normal: 3, harder: 4 };
