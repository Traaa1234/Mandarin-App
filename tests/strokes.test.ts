import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strokePinyin } from '../src/lib/strokes';

describe('strokePinyin', () => {
  it('joins the syllables of a compound stroke name', () => {
    expect(strokePinyin('横')).toBe('héng');
    expect(strokePinyin('横折钩')).toBe('héngzhégōu');
    expect(strokePinyin('卧钩')).toBe('wògōu');
  });

  it('knows every syllable used in content/stroke-names.json', () => {
    const { names } = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'content', 'stroke-names.json'), 'utf8'),
    ) as { names: Record<string, string | null> };
    for (const list of Object.values(names)) {
      for (const name of list?.split(' ') ?? []) {
        expect(strokePinyin(name).length, name).toBeGreaterThanOrEqual(Array.from(name).length * 2);
        for (const ch of name) expect(strokePinyin(ch), `${ch} in ${name}`).not.toBe('');
      }
    }
  });
});
