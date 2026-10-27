import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Rating } from 'ts-fsrs';
import { describe, expect, it } from 'vitest';
import type { DataIndex } from '../src/data/types';
import { kindsFor } from '../src/practice/kinds';
import { rateOutcome } from '../src/practice/rating';
import { buildSession, currentStage, MAX_NEW, MAX_REVIEWS } from '../src/practice/session';

const index = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'public', 'data', 'index.json'), 'utf8')) as DataIndex;

describe('rateOutcome follows the spec table', () => {
  it('fast and right first time is Easy, slower is Good', () => {
    expect(rateOutcome({ retries: 0, helped: false, ms: 2500 })).toBe(Rating.Easy);
    expect(rateOutcome({ retries: 0, helped: false, ms: 6000 })).toBe(Rating.Good);
  });
  it('one retry is Hard; the hint or the answer shown is Again', () => {
    expect(rateOutcome({ retries: 1, helped: false, ms: 6000 })).toBe(Rating.Hard);
    expect(rateOutcome({ retries: 0, helped: true, ms: 1000 })).toBe(Rating.Again);
  });
  it('rates writing by mistakes: 0 Easy, 1–3 Hard, more Again', () => {
    expect(rateOutcome({ retries: 0, helped: false, ms: 20000, writeMistakes: 0 })).toBe(Rating.Easy);
    expect(rateOutcome({ retries: 0, helped: false, ms: 20000, writeMistakes: 3 })).toBe(Rating.Hard);
    expect(rateOutcome({ retries: 0, helped: false, ms: 20000, writeMistakes: 5 })).toBe(Rating.Again);
  });
});

describe('kindsFor', () => {
  it('gives pictured roots, compounds and costumes all four cards', () => {
    expect(kindsFor(index.chars['人'])).toEqual(['see', 'hear', 'write', 'tone']);
    expect(kindsFor(index.chars['安'])).toEqual(['see', 'hear', 'write', 'tone']);
    expect(kindsFor(index.chars['亻'])).toEqual(['see', 'hear', 'write', 'tone']);
  });
  it('starts helper parts with nothing to look at on Hear it', () => {
    expect(kindsFor(index.chars['力'])).toEqual(['hear', 'write', 'tone']);
  });
});

describe('buildSession', () => {
  const now = new Date('2026-10-26T09:00:00Z');
  const day = 86400000;

  it('starts a new child on the first three roots', () => {
    expect(buildSession(index, [], now)).toEqual([
      { type: 'new', char: '人' },
      { type: 'new', char: '口' },
      { type: 'new', char: '日' },
    ]);
  });

  it('puts due reviews first, most overdue first, then new characters', () => {
    const cards = [
      { char: '人', kind: 'see' as const, due: new Date(now.getTime() - day) },
      { char: '口', kind: 'see' as const, due: new Date(now.getTime() - 3 * day) },
      { char: '日', kind: 'see' as const, due: new Date(now.getTime() + day) },
    ];
    expect(buildSession(index, cards, now)).toEqual([
      { type: 'review', char: '口', kind: 'see' },
      { type: 'review', char: '人', kind: 'see' },
      { type: 'new', char: '月' },
      { type: 'new', char: '山' },
      { type: 'new', char: '水' },
    ]);
  });

  it('caps reviews at 10 and new characters at 3', () => {
    const cards = Object.keys(index.chars)
      .slice(0, 15)
      .map((char, i) => ({ char, kind: 'hear' as const, due: new Date(now.getTime() - i * 1000) }));
    const steps = buildSession(index, cards, now);
    expect(steps.filter((s) => s.type === 'review')).toHaveLength(MAX_REVIEWS);
    expect(steps.filter((s) => s.type === 'new')).toHaveLength(MAX_NEW);
  });

  it('reports the stage being worked on', () => {
    expect(currentStage(index, new Set())).toBe(1);
    expect(currentStage(index, new Set(index.stages[0].chars))).toBe(3);
  });
});

describe('Word Village', () => {
  const now = new Date('2026-10-26T09:00:00Z');
  it('plants words only after every character on the path has started', () => {
    const chars = Object.entries(index.chars).filter(([, e]) => e.role !== 'festival' && index.stages.find((s) => s.id === e.stage)?.ready);
    const started = chars.map(([char]) => ({ char, kind: 'hear' as const, due: new Date(now.getTime() + 86400000) }));
    expect(buildSession(index, started.slice(1), now)[0]).toEqual({ type: 'new', char: chars[0][0] });
    expect(buildSession(index, started, now)).toEqual(Object.keys(index.words).slice(0, MAX_NEW).map((char) => ({ type: 'new', char })));
  });
});
