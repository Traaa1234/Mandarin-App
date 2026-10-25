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

export interface Leaf {
  char: string;
  // Position in the decomposition tree: ⿱木⿰木木 has leaves at [0], [1, 0] and [1, 1].
  path: number[];
}

// Every known component with its tree path, left to right.
export function leafPaths(ids: string): Leaf[] {
  const out: Leaf[] = [];
  const walk = (node: IdsNode, path: number[]) => {
    if (typeof node === 'string') {
      if (node !== UNKNOWN) out.push({ char: node, path });
    } else node.parts.forEach((part, i) => walk(part, [...path, i]));
  };
  walk(parseIds(ids), []);
  return out;
}

// For each stroke, the index of the leaf it belongs to, from Make Me a Hanzi's
// `matches` field, or -1 when the source does not say. A match that stops at an
// inner node of the tree goes to the first leaf below it.
export function strokeLeaves(matches: (number[] | null)[], leafList: Leaf[]): number[] {
  return matches.map((match) => {
    if (!match) return -1;
    return leafList.findIndex(
      (leaf) => match.length <= leaf.path.length && match.every((step, i) => leaf.path[i] === step),
    );
  });
}
