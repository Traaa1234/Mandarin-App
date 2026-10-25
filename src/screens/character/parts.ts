import type { CharData } from '../../data/types';
import { leafPaths, strokeLeaves, type Leaf } from '../../lib/ids';
import { partColor } from '../../lib/colors';

export interface PartView {
  leaves: Leaf[];
  // Leaf index of each stroke, -1 when unknown.
  strokeLeaf: number[];
  // Stroke colors with each part in its own color.
  colors: string[];
}

// Only compounds are split into parts for children; a root's own decomposition
// (口 = 冂 + 一) is not meaningful at this age.
export function partView(data: CharData): PartView | null {
  if (data.role !== 'compound') return null;
  const leaves = leafPaths(data.decomposition);
  const strokeLeaf = strokeLeaves(data.matches, leaves);
  return { leaves, strokeLeaf, colors: strokeLeaf.map(partColor) };
}
