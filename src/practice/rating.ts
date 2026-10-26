import { Rating } from 'ts-fsrs';

// What happened when a child answered one card. Children never grade themselves:
// the rating comes from this, following the table in the build spec.
export interface Outcome {
  // Wrong answers before the right one (0 = right first try).
  retries: number;
  // The hint or the answer had to be shown.
  helped: boolean;
  // Time to the right answer, in milliseconds.
  ms: number;
  // Write cards only: Hanzi Writer's totalMistakes for the quiz.
  writeMistakes?: number;
}

export const FAST_MS = 4000;

export type FsrsRating = Rating.Again | Rating.Hard | Rating.Good | Rating.Easy;

export function rateOutcome(o: Outcome): FsrsRating {
  if (o.helped) return Rating.Again;
  if (o.writeMistakes !== undefined) {
    if (o.writeMistakes === 0) return Rating.Easy;
    if (o.writeMistakes <= 3) return Rating.Hard;
    return Rating.Again;
  }
  if (o.retries === 0) return o.ms < FAST_MS ? Rating.Easy : Rating.Good;
  if (o.retries === 1) return Rating.Hard;
  return Rating.Again;
}
