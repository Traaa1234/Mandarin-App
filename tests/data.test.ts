// Checks the generated files in public/data/ against content/stages.json.
// Run `npm run data` first if these fail after a content change.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { charFile, pictureFile } from '../src/data/types';
import type { CharData, DataIndex } from '../src/data/types';

const ROOT = join(import.meta.dirname, '..');
const read = <T>(...path: string[]) =>
  JSON.parse(readFileSync(join(ROOT, ...path), 'utf8')) as T;

const content = read<{
  stages: { id: number; ready: boolean; items?: { char: string }[] }[];
}>('content', 'stages.json');
const index = read<DataIndex>('public', 'data', 'index.json');
const chars = Object.keys(index.chars).map((c) =>
  read<CharData>('public', 'data', 'chars', charFile(c)),
);
const byChar = new Map(chars.map((d) => [d.character, d]));

describe('generated data', () => {
  it('covers every item of every ready stage, and nothing else', () => {
    const expected = content.stages
      .filter((s) => s.ready)
      .flatMap((s) => s.items ?? [])
      .map((i) => i.char);
    expect(Object.keys(index.chars)).toEqual(expected);
    expect(readdirSync(join(ROOT, 'public', 'data', 'chars')).sort()).toEqual(
      expected.map(charFile).sort(),
    );
  });

  it('ships the 20 stage-1 roots and the stage 4–5 compounds', () => {
    expect(index.stages.find((s) => s.id === 1)?.chars).toHaveLength(20);
    for (const c of ['林', '森', '从', '众', '炎', '晶', '品', '明', '好', '休', '男', '鸣', '尖', '歪', '安']) {
      expect(byChar.get(c)?.role, c).toBe('compound');
    }
  });

  it('teaches every part of a compound before the compound', () => {
    for (const d of chars.filter((d) => d.role === 'compound')) {
      expect(d.parts.length, d.character).toBeGreaterThan(0);
      for (const part of d.parts) {
        const p = byChar.get(part);
        expect(p, `${d.character} needs ${part}`).toBeDefined();
        expect(p!.order, `${part} comes before ${d.character}`).toBeLessThan(d.order);
      }
    }
  });

  it('teaches each root before its costume', () => {
    for (const d of chars.filter((d) => d.role === 'costume')) {
      expect(byChar.get(d.costumeOf!)!.order).toBeLessThan(d.order);
    }
  });

  it('has stroke paths, medians and one match per stroke', () => {
    for (const d of chars) {
      expect(d.strokes.length, d.character).toBeGreaterThan(0);
      expect(d.medians).toHaveLength(d.strokes.length);
      expect(d.matches).toHaveLength(d.strokes.length);
    }
  });

  it('maps the strokes of 好, 明, 休, 林 and 森 to their parts', () => {
    for (const c of ['好', '明', '休', '林', '森']) {
      const d = byChar.get(c)!;
      expect(d.matches.every((m) => Array.isArray(m)), c).toBe(true);
    }
    // 好 = 女 (3 strokes) + 子 (3 strokes)
    expect(byChar.get('好')!.matches).toEqual([[0], [0], [0], [1], [1], [1]]);
  });

  it('names every stroke, and each simple stroke points the way its name says', () => {
    // Make Me a Hanzi's y axis points up. 点 and compound strokes are not checked.
    const fits: Record<string, (dx: number, dy: number) => boolean> = {
      横: (dx, dy) => dx > 0 && Math.abs(dy) < 0.35 * dx,
      竖: (dx, dy) => dy < 0 && Math.abs(dx) < 0.5 * -dy,
      提: (dx, dy) => dx > 0 && dy > -0.1 * dx,
      撇: (dx, dy) => dx < 0 && dy < 0,
      捺: (dx, dy) => dx > 0 && dy < 0,
    };
    for (const d of chars) {
      if (d.character === '艸') continue; // not yet checked, see content/stroke-names.json
      expect(d.strokeNames, d.character).toHaveLength(d.strokes.length);
      d.strokeNames!.forEach((name, i) => {
        const median = d.medians[i];
        const [x0, y0] = median[0];
        const [x1, y1] = median[median.length - 1];
        expect(fits[name]?.(x1 - x0, y1 - y0) ?? true, `${d.character} stroke ${i + 1} ${name}`).toBe(true);
      });
    }
  });

  it('uses tone-marked pinyin for every item', () => {
    for (const d of chars) {
      expect(d.pinyin, d.character).toMatch(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/);
    }
  });

  it('gives every character a memory line, and the 20 starter cards a picture', () => {
    for (const d of chars) expect(d.mnemonic.story, d.character).not.toBe('');
    const starters = [...'人口日月山水火木林森女子好明休目雨田马鱼'];
    for (const c of starters) {
      const d = byChar.get(c)!;
      expect(d.mnemonic.generated, c).toBe(false);
      expect(d.mnemonic.picture, c).toBe(pictureFile(c));
      expect(index.chars[c].picture).toBe(pictureFile(c));
    }
    // 好's line is hand-written; 安's is generated from its parts.
    expect(byChar.get('安')!.mnemonic).toEqual({
      story: '宀 roof + 女 woman = 安 peaceful.',
      picture: null,
      generated: true,
    });
  });

  it('draws each picture in the card frame, clipped to its rounded corners', () => {
    for (const file of readdirSync(join(ROOT, 'public', 'mnemonics'))) {
      const svg = readFileSync(join(ROOT, 'public', 'mnemonics', file), 'utf8');
      expect(svg, file).toContain('viewBox="-112 -112 1248 1248"');
      expect(svg, file).toContain(`clip-path="url(#card-${file.replace('.svg', '')})"`);
      // Original drawings only: no embedded photos or linked images.
      expect(svg, file).not.toMatch(/<image|href=/);
    }
  });

  it('builds the family index from the compounds', () => {
    expect(index.families['木']).toEqual(['林', '森', '休']);
    // 休 contains 亻, the costume of 人, so it joins both families.
    expect(index.families['人']).toContain('休');
    expect(index.families['亻']).toEqual(['休']);
  });
});
