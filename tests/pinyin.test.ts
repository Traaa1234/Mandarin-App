import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { convert, pinyin } from 'pinyin-pro';
import { describe, expect, it } from 'vitest';
import { buildKey, parseKey, splitSyllables, spokenTones, syllableKey } from '../src/lib/pinyin';

const ROOT = join(import.meta.dirname, '..');
const content = JSON.parse(readFileSync(join(ROOT, 'content', 'pinyin.json'), 'utf8'));
const recorded = new Set<string>(
  JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'syllables.json'), 'utf8')),
);

describe('pinyin content', () => {
  it('only plays syllables that have a recording', () => {
    const keys: string[] = [];
    for (const g of content.groups) for (const row of g.rows) for (const t of row) keys.push(t.say);
    for (const rule of content.rules) {
      for (const p of rule.practice) if (p.say) keys.push(...p.say.split(' '));
    }
    for (let tone = 1; tone <= 5; tone++) keys.push(`${content.toneExample}${tone}`);
    for (const k of keys) expect(recorded.has(k), k).toBe(true);
  });

  it('places tone marks the way pinyin-pro does', () => {
    for (const p of content.rules.find((r: { id: string }) => r.id === 'mark').practice) {
      expect(convert(p.prompt), p.prompt).toBe(p.answer);
    }
  });

  it('agrees with pinyin-pro on 一 and 不', () => {
    for (const id of ['bu', 'yi']) {
      for (const p of content.rules.find((r: { id: string }) => r.id === id).practice) {
        expect(pinyin(p.prompt), p.prompt).toBe(p.answer);
      }
    }
  });

  it('lists every recording as a lowercase syllable and tone', () => {
    expect(recorded.size).toBeGreaterThan(1600);
    for (const k of recorded) expect(k).toMatch(/^[a-z]+[1-5]$/);
  });
});

describe('syllable keys', () => {
  it('turns tone-marked pinyin into recording names', () => {
    expect(syllableKey('hǎo')).toBe('hao3');
    expect(syllableKey('nǚ')).toBe('nv3');
    expect(syllableKey('ba')).toBe('ba5');
  });

  it('splits a key into initial, final and tone', () => {
    expect(parseKey('zhuang1')).toEqual({ initial: 'zh', final: 'uang', tone: 1 });
    expect(parseKey('an4')).toEqual({ initial: '', final: 'an', tone: 4 });
    expect(parseKey('lve4')).toEqual({ initial: 'l', final: 'üe', tone: 4 });
  });

  it('builds keys, dropping the dots of ü after j, q, x and y', () => {
    expect(buildKey('j', 'ü', 1)).toBe('ju1');
    expect(buildKey('n', 'ü', 3)).toBe('nv3');
    expect(buildKey('', 'a', 1)).toBe('a1');
  });
});

describe('splitSyllables and spokenTones', () => {
  const bases = new Set([...recorded].map((k) => k.slice(0, -1)));

  it('splits written pinyin into one syllable per character', () => {
    expect(splitSyllables('nǐ jiào shénme míngzi', bases)).toEqual(['nǐ', 'jiào', 'shén', 'me', 'míng', 'zi']);
    expect(splitSyllables('duìbuqǐ', bases)).toEqual(['duì', 'bu', 'qǐ']);
    expect(splitSyllables("wǎn'ān", bases)).toEqual(['wǎn', 'ān']);
    expect(splitSyllables('nǚ', bases)).toEqual(['nǚ']);
  });

  it('turns a run of 3rd tones into 2nd tones except the last', () => {
    expect(spokenTones([3, 3])).toEqual([2, 3]);
    expect(spokenTones([3, 4, 3])).toEqual([3, 4, 3]);
    expect(spokenTones([3, 3, 3])).toEqual([2, 2, 3]);
  });
});
