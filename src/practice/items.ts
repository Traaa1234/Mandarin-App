import type { DataIndex } from '../data/types';
import { kindsFor, WORD_KINDS, type Kind } from './kinds';

// A practice item is a character, or a Word Village word of two or more characters.
export const isWord = (item: string) => Array.from(item).length > 1;

// The cards an item has, in unlock order.
export const itemKinds = (index: DataIndex, item: string): Kind[] => (isWord(item) ? WORD_KINDS : kindsFor(index.chars[item]));

export const itemPinyin = (index: DataIndex, item: string) => (isWord(item) ? index.words[item]?.pinyin : index.chars[item]?.pinyin) ?? '';

// Everything on the learning path (festival characters are not), with its stage and order.
export const pathItems = (index: DataIndex): [string, { stage: number; order: number }][] => [
  ...Object.entries(index.chars).filter(([, e]) => e.role !== 'festival'),
  ...Object.entries(index.words ?? {}),
];
