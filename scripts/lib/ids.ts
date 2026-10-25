// Ideographic Description Sequences, as used in Make Me a Hanzi's `decomposition`
// field: ⿰女子 = 女 left of 子; ⿱木⿰木木 = 木 above (木 beside 木).

// The binary IDS operators, and the two ternary ones (⿲ ⿳).
const BINARY = new Set(['⿰', '⿱', '⿴', '⿵', '⿶', '⿷', '⿸', '⿹', '⿺', '⿻']);
const TERNARY = new Set(['⿲', '⿳']);

// Make Me a Hanzi writes an unknown component as a full-width question mark.
export const UNKNOWN = '？';

export type IdsNode = string | { op: string; parts: IdsNode[] };

export function parseIds(ids: string): IdsNode {
  const chars = Array.from(ids);
  let pos = 0;
  const read = (): IdsNode => {
    const c = chars[pos++];
    if (c === undefined) throw new Error(`Truncated IDS: ${ids}`);
    const arity = BINARY.has(c) ? 2 : TERNARY.has(c) ? 3 : 0;
    if (arity === 0) return c;
    const parts: IdsNode[] = [];
    for (let i = 0; i < arity; i++) parts.push(read());
    return { op: c, parts };
  };
  const tree = read();
  if (pos !== chars.length) throw new Error(`Trailing characters in IDS: ${ids}`);
  return tree;
}

// The components of an IDS, left to right, skipping unknown ones.
// leaves('⿱木⿰木木') → ['木', '木', '木']
export function leaves(ids: string): string[] {
  const out: string[] = [];
  const walk = (node: IdsNode) => {
    if (typeof node === 'string') {
      if (node !== UNKNOWN) out.push(node);
    } else node.parts.forEach(walk);
  };
  walk(parseIds(ids));
  return out;
}

// Pinyin without tone marks, for comparing readings: 'nǚ' → 'nü'.
export function stripTones(pinyin: string): string {
  return pinyin
    .normalize('NFD')
    .replace(/[̀-̄̌]/g, '')
    .normalize('NFC')
    .toLowerCase();
}
