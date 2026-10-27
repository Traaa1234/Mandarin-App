import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { PhraseData } from '../src/data/types';

const ROOT = join(import.meta.dirname, '..');
const read = (...p: string[]) => JSON.parse(readFileSync(join(ROOT, ...p), 'utf8'));
const content = read('content', 'phrases.json');
const stages = read('content', 'stages.json');
const words = stages.stages.flatMap((s: { ready: boolean; words?: { id: string }[] }) => (s.ready ? (s.words ?? []) : []));
const data = read('public', 'data', 'phrases.json') as PhraseData;
const recorded = new Set<string>(read('public', 'data', 'syllables.json'));
const phrases = data.scenes.flatMap((s) => s.phrases);

describe('Speak Mandarin phrases', () => {
  it('builds every phrase in the content file, scene by scene', () => {
    expect(data.scenes.map((s) => s.id)).toEqual([...content.scenes.map((s: { id: string }) => s.id), 'words']);
    expect(phrases.map((p) => p.id)).toEqual([
      ...content.scenes.flatMap((s: { phrases: { id: string }[] }) => s.phrases.map((p) => p.id)),
      ...words.map((w: { id: string }) => `word-${w.id}`),
    ]);
    expect(phrases.filter((p) => !data.scenes.find((s) => s.phrases.includes(p))!.hidden)).toHaveLength(42);
  });

  it('builds a recording for every Word Village word', () => {
    const index = read('public', 'data', 'index.json');
    expect(Object.keys(index.words)).toHaveLength(words.length);
    for (const w of Object.values(index.words) as { audio: string }[]) {
      expect(phrases.some((p) => p.audio === w.audio), w.audio).toBe(true);
      expect(existsSync(join(ROOT, 'public', w.audio)), w.audio).toBe(true);
    }
  });

  it('has one syllable per character, each with a recording', () => {
    for (const p of phrases) {
      const han = Array.from(p.chars).filter((c) => /\p{Script=Han}/u.test(c));
      expect(p.syllables.map((s) => s.char), p.id).toEqual(han);
      for (const s of p.syllables) expect(recorded.has(s.key), `${p.id} ${s.key}`).toBe(true);
    }
  });

  it('says 你好 as ní hǎo', () => {
    const p = phrases.find((x) => x.id === 'ni-hao')!;
    expect(p.syllables.map((s) => [s.written, s.key])).toEqual([
      ['nǐ', 'ni2'],
      ['hǎo', 'hao3'],
    ]);
  });

  it('ships an audio file per phrase with increasing syllable times', () => {
    for (const p of phrases) {
      expect(existsSync(join(ROOT, 'public', p.audio)), p.id).toBe(true);
      if (!p.times) continue;
      expect(p.times, p.id).toHaveLength(p.syllables.length);
      p.times.forEach(([a, b], i) => {
        expect(b, p.id).toBeGreaterThan(a);
        if (i) expect(a, p.id).toBeGreaterThanOrEqual(p.times![i - 1][1] - 0.001);
      });
    }
  });
});
