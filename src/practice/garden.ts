import type { DataIndex } from '../data/types';

export type Bloom = 'bloom' | 'open' | 'sleepy';

const HOUR = 3600000;

// A learned character's flower. Reviewed in the last day: in full bloom.
// A card overdue by more than half a day: sleepy, never wilted or dead, and
// one review wakes it. Otherwise open.
export function flowerState(due: Date[], lastReview: Date | null, now: Date): Bloom {
  if (due.some((d) => now.getTime() - d.getTime() > 12 * HOUR)) return 'sleepy';
  if (lastReview && now.getTime() - lastReview.getTime() < 24 * HOUR) return 'bloom';
  return 'open';
}

// The garden grows a level every few new characters.
export const CHARS_PER_LEVEL = 5;
export const gardenLevel = (learned: number) => Math.floor(learned / CHARS_PER_LEVEL);

// What each level adds to the garden, in order.
export const LEVEL_DECOR = ['🪨', '🦋', '🌳', '🐝', '🌈', '🐞', '⛲', '🏡', '🎏', '🌙'];

export interface Island {
  id: number;
  island: string;
  total: number;
  learned: number;
  state: 'done' | 'open' | 'locked' | 'building';
}

// The seven stages as garden islands, unlocked in order. An island with no
// characters to learn (Stroke Valley) is passed on the way; stages not yet
// filled in are under construction.
export function islands(index: DataIndex, learned: Set<string>): Island[] {
  let previousDone = true;
  return index.stages.filter((s) => s.key !== 'festivals').map((s) => {
    const got = s.chars.filter((c) => learned.has(c)).length;
    const complete = got === s.chars.length;
    const state: Island['state'] = !s.ready ? 'building' : !previousDone ? 'locked' : complete && s.chars.length ? 'done' : 'open';
    previousDone = previousDone && s.ready && complete;
    return { id: s.id, island: s.island, total: s.chars.length, learned: got, state };
  });
}
