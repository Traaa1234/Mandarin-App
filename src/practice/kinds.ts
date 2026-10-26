import type { IndexEntry } from '../data/types';

// Each character has up to four cards, unlocked one after another.
export const KINDS = ['see', 'hear', 'write', 'tone'] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_ICON: Record<Kind, string> = { see: '👀', hear: '👂', write: '✏️', tone: '🎵' };

// The cards a character has, in unlock order. "See it" needs something to look
// at: a picture, the parts of a compound, or the root a costume comes from.
// Helper parts with none of these start at "Hear it".
export function kindsFor(entry: IndexEntry): Kind[] {
  const canSee = !!entry.picture || entry.role === 'compound' || entry.role === 'costume';
  return canSee ? [...KINDS] : KINDS.filter((k) => k !== 'see');
}
