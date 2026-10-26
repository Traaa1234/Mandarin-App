import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DataIndex } from '../src/data/types';
import { flowerState, gardenLevel, islands } from '../src/practice/garden';

const index = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'index.json'), 'utf8')) as DataIndex;
const now = new Date('2026-10-26T09:00:00Z');
const h = (hours: number) => new Date(now.getTime() + hours * 3600000);

describe('flowerState', () => {
  it('blooms after a review today, opens later, and gets sleepy when overdue', () => {
    expect(flowerState([h(48)], h(-2), now)).toBe('bloom');
    expect(flowerState([h(48)], h(-30), now)).toBe('open');
    expect(flowerState([h(-20), h(48)], h(-60), now)).toBe('sleepy');
  });
  it('wakes up with a review: no card overdue any more', () => {
    expect(flowerState([h(30), h(48)], now, now)).toBe('bloom');
  });
});

describe('garden and islands', () => {
  it('grows a level every five characters', () => {
    expect([0, 4, 5, 12].map(gardenLevel)).toEqual([0, 0, 1, 2]);
  });

  it('opens the islands in order and passes Stroke Valley', () => {
    expect(islands(index, new Set()).map((i) => i.state)).toEqual(['open', 'locked', 'locked', 'locked', 'locked', 'building', 'building']);
    const meadow = new Set(index.stages[0].chars);
    expect(islands(index, meadow).map((i) => i.state)).toEqual(['done', 'open', 'open', 'locked', 'locked', 'building', 'building']);
  });
});

describe('calendar', async () => {
  const { weekId, dragonAvailable } = await import('../src/practice/calendar');
  it('names a week by its Monday', () => {
    expect(weekId(new Date('2026-10-26T10:00:00'))).toBe('2026-10-26'); // Monday
    expect(weekId(new Date('2026-11-01T10:00:00'))).toBe('2026-10-26'); // Sunday
    expect(weekId(new Date('2026-11-02T10:00:00'))).toBe('2026-11-02');
  });
  it('brings the dragon on Sundays, once a week', () => {
    const sunday = new Date('2026-11-01T10:00:00');
    expect(dragonAvailable(sunday, null)).toBe(true);
    expect(dragonAvailable(sunday, '2026-10-26')).toBe(false);
    expect(dragonAvailable(new Date('2026-10-31T10:00:00'), null)).toBe(false);
  });
});

describe('festivals', async () => {
  const { activeFestival } = await import('../src/practice/festivals');
  it('shows a festival from a week before to a week after its date', () => {
    expect(activeFestival(new Date('2027-02-01T10:00:00'))?.id).toBe('lunar-new-year');
    expect(activeFestival(new Date('2027-02-13T10:00:00'))?.id).toBe('lunar-new-year');
    expect(activeFestival(new Date('2027-02-14T10:00:00'))).toBe(null);
    expect(activeFestival(new Date('2026-09-25T10:00:00'))?.id).toBe('mid-autumn');
  });
  it('keeps festival characters out of the learning path and the islands', () => {
    expect(islands(index, new Set()).map((i) => i.island)).not.toContain('Festival Fair');
    expect(Object.entries(index.chars).filter(([, e]) => e.role === 'festival').map(([c]) => c)).toEqual(['红', '福', '春', '龙', '船', '饼']);
  });
});

describe('festival names have recordings', async () => {
  const raw = (await import('../content/festivals.json')).default as { festivals: { pinyin: string }[] };
  const { syllableKey } = await import('../src/lib/syllable');
  const { readFileSync } = await import('node:fs');
  const recorded = new Set<string>(JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'syllables.json'), 'utf8')));
  it('splits each name into recorded syllables', () => {
    for (const f of raw.festivals) for (const s of f.pinyin.split(' ')) expect(recorded.has(syllableKey(s)), s).toBe(true);
  });
});
