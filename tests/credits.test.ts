import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DATA, LIBRARIES, VOICES } from '../src/credits';

const ROOT = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

describe('credits', () => {
  it('lists every library the app ships', () => {
    const credited = new Set([...LIBRARIES, ...DATA].flatMap((c) => c.packages ?? []));
    for (const dep of Object.keys(pkg.dependencies)) expect(credited.has(dep), dep).toBe(true);
  });
  it('credits both recorded voices', () => {
    expect(VOICES.map((v) => v.by).join(' ')).toMatch(/Chen Wang[\s\S]*Yue Tan/);
  });
  it('ships the license texts it links to', () => {
    for (const c of [...DATA, ...VOICES, ...LIBRARIES]) if (c.licenseFile) expect(existsSync(join(ROOT, 'public', c.licenseFile)), c.licenseFile).toBe(true);
  });
});
