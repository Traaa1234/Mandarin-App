import type { DataIndex } from '../../data/types';
import { shuffle } from './useChoice';

// Other characters to choose from, preferring ones the child has met and,
// optionally, ones that pass a filter (e.g. "has a picture" or "sounds different").
export function distractors(
  index: DataIndex,
  answer: string,
  met: Set<string>,
  count: number,
  keep: (c: string) => boolean = () => true,
): string[] {
  const pool = Object.keys(index.chars).filter((c) => c !== answer && keep(c));
  const known = shuffle(pool.filter((c) => met.has(c)));
  const rest = shuffle(pool.filter((c) => !met.has(c)));
  return [...known, ...rest].slice(0, count);
}
