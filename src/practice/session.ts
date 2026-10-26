import type { DataIndex } from '../data/types';
import type { Kind } from './kinds';

export const MAX_REVIEWS = 10;
export const MAX_NEW = 3;
export const SESSION_MS = 8 * 60 * 1000;

export interface CardState {
  char: string;
  kind: Kind;
  due: Date;
}

export type Step = { type: 'review'; char: string; kind: Kind } | { type: 'new'; char: string };

// Today's session: up to 10 due reviews, most overdue first, then up to 3 new
// characters in learning order. A character is new until it has a card. Empty
// means nothing is due and nothing is left to learn: offer free play instead.
export function buildSession(index: DataIndex, cards: CardState[], now: Date): Step[] {
  const reviews = cards
    .filter((c) => c.due.getTime() <= now.getTime())
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, MAX_REVIEWS)
    .map((c): Step => ({ type: 'review', char: c.char, kind: c.kind }));

  const started = new Set(cards.map((c) => c.char));
  const fresh = Object.entries(index.chars)
    .filter(([c, e]) => !started.has(c) && index.stages.find((s) => s.id === e.stage)?.ready)
    .sort(([, a], [, b]) => a.order - b.order)
    .slice(0, MAX_NEW)
    .map(([char]): Step => ({ type: 'new', char }));

  return [...reviews, ...fresh];
}

// The stage the child is working on: the first one with a character not yet started.
export function currentStage(index: DataIndex, startedChars: Set<string>): number {
  const next = Object.entries(index.chars)
    .filter(([c]) => !startedChars.has(c))
    .sort(([, a], [, b]) => a.order - b.order)[0];
  return next ? next[1].stage : Math.max(...index.stages.filter((s) => s.chars.length).map((s) => s.id));
}
