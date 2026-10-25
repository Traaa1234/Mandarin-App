import { describe, expect, it } from 'vitest';
import { leaves, parseIds, stripTones } from '../scripts/lib/ids';

describe('parseIds', () => {
  it('reads a single character', () => {
    expect(parseIds('女')).toBe('女');
  });

  it('reads nested sequences', () => {
    expect(parseIds('⿱木⿰木木')).toEqual({
      op: '⿱',
      parts: ['木', { op: '⿰', parts: ['木', '木'] }],
    });
  });

  it('reads ternary operators', () => {
    expect(leaves('⿲彳亍㇒')).toEqual(['彳', '亍', '㇒']);
  });

  it('rejects truncated and over-long sequences', () => {
    expect(() => parseIds('⿰女')).toThrow(/Truncated/);
    expect(() => parseIds('女子')).toThrow(/Trailing/);
  });
});

describe('leaves', () => {
  it('lists components left to right and skips unknown ones', () => {
    expect(leaves('⿰女子')).toEqual(['女', '子']);
    expect(leaves('⿱⿱⺈田一')).toEqual(['⺈', '田', '一']);
    expect(leaves('⿻亅？')).toEqual(['亅']);
  });
});

describe('stripTones', () => {
  it('removes tone marks but keeps ü', () => {
    expect(stripTones('nǚ')).toBe('nü');
    expect(stripTones('zǐ')).toBe('zi');
    expect(stripTones('Shuǐ')).toBe('shui');
  });
});
