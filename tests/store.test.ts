import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DataIndex } from '../src/data/types';
import { GardenDb } from '../src/practice/db';
import { buildSession } from '../src/practice/session';
import { Store } from '../src/practice/store';

const index = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'index.json'), 'utf8')) as DataIndex;
const now = new Date('2026-10-26T09:00:00');
const later = (minutes: number) => new Date(now.getTime() + minutes * 60000);

let store: Store;
let db: GardenDb;
let n = 0;
beforeEach(() => {
  db = new GardenDb(`test-${n++}`);
  store = new Store(db, fsrs(generatorParameters({ enable_fuzz: false })));
});

describe('Store', () => {
  it('allows up to four animal profiles', async () => {
    for (const a of ['🐼', '🐯', '🐰', '🐸']) await store.addProfile(a, now);
    await expect(store.addProfile('🦊', now)).rejects.toThrow(/At most 4/);
    expect((await store.profiles()).map((p) => p.animal)).toEqual(['🐼', '🐯', '🐰', '🐸']);
  });

  it('schedules a fast right answer further out than a helped one', async () => {
    const id = await store.addProfile('🐼', now);
    await store.startChar(id, '人', index, now);
    await store.startChar(id, '口', index, now);
    expect(await store.answer(id, '人', 'see', { retries: 0, helped: false, ms: 2000 }, index, now)).toBe(Rating.Easy);
    expect(await store.answer(id, '口', 'see', { retries: 0, helped: true, ms: 9000 }, index, now)).toBe(Rating.Again);
    const cards = await store.cards(id);
    const due = (c: string) => cards.find((r) => r.char === c && r.kind === 'see')!.card.due.getTime();
    expect(due('人')).toBeGreaterThan(due('口'));
    expect(cards.find((r) => r.char === '人' && r.kind === 'see')!.card.state).not.toBe(State.New);
  });

  it('unlocks the next card only after a pass, due the next day', async () => {
    const id = await store.addProfile('🐼', now);
    await store.startChar(id, '人', index, now);
    await store.answer(id, '人', 'see', { retries: 0, helped: true, ms: 1000 }, index, now);
    expect((await store.cards(id)).map((r) => r.kind)).toEqual(['see']);
    await store.answer(id, '人', 'see', { retries: 0, helped: false, ms: 1000 }, index, later(10));
    const hear = (await store.cards(id)).find((r) => r.kind === 'hear')!;
    expect(hear.card.due.getTime()).toBe(later(10).getTime() + 86400000);
    expect(await store.learned(id)).toEqual(new Set(['人']));
  });

  it('feeds the session builder: new characters first, then their reviews', async () => {
    const id = await store.addProfile('🐼', now);
    for (const s of buildSession(index, [], now)) await store.startChar(id, s.char, index, now);
    const due = (await store.cards(id)).map((r) => ({ char: r.char, kind: r.kind, due: r.card.due }));
    expect(buildSession(index, due, later(1)).slice(0, 3)).toEqual([
      { type: 'review', char: '人', kind: 'see' },
      { type: 'review', char: '口', kind: 'see' },
      { type: 'review', char: '日', kind: 'see' },
    ]);
  });

  it('grows a flower per learned character, sleepy when overdue', async () => {
    const id = await store.addProfile('🐼', now);
    await store.startChar(id, '人', index, now);
    await store.startChar(id, '口', index, now);
    await store.answer(id, '人', 'see', { retries: 0, helped: false, ms: 1000 }, index, now);
    expect(await store.garden(id, later(60))).toEqual([{ char: '人', bloom: 'bloom' }]);
    // Three days later the unlocked Hear card is long overdue.
    expect(await store.garden(id, later(3 * 24 * 60))).toEqual([{ char: '人', bloom: 'sleepy' }]);
  });

  it('adds up practice time per day', async () => {
    const id = await store.addProfile('🐼', now);
    await store.addTime(id, 60000, now);
    await store.addTime(id, 30000, later(5));
    expect(await db.days.get([id, '2026-10-26'])).toEqual({ profileId: id, date: '2026-10-26', ms: 90000 });
  });
});

describe('Store: game layer', () => {
  it('earns and spends seeds, never going below zero', async () => {
    const id = await store.addProfile('🐼', now);
    expect(await store.addSeeds(id, 5)).toBe(5);
    expect(await store.buy(id, 'decor:🦋', 8, now)).toBe(false);
    await store.addSeeds(id, 5);
    expect(await store.buy(id, 'decor:🦋', 8, now)).toBe(true);
    expect(await store.seeds(id)).toBe(2);
    expect(await store.owned(id)).toEqual(new Set(['decor:🦋']));
  });

  it('keeps small values and a log of events per child', async () => {
    const a = await store.addProfile('🐼', now);
    const b = await store.addProfile('🐯', now);
    await store.setMeta(a, 'best:人', 9.5);
    expect(await store.getMeta(a, 'best:人', null)).toBe(9.5);
    expect(await store.getMeta(b, 'best:人', null)).toBe(null);
    await store.log(a, 'game', { id: 'catch', score: 4 }, now);
    expect((await store.events(a, 'game')).map((e) => e.data)).toEqual([{ id: 'catch', score: 4 }]);
    expect(await store.events(b, 'game')).toEqual([]);
  });
});
