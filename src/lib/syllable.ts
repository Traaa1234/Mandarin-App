import { stripTones } from './ids';
import { toneOf } from './tones';

// Recordings are named like audio-cmn's files: syllable without marks, ü as v,
// then the tone number (5 = neutral). 'hǎo' → 'hao3', 'nǚ' → 'nv3'.
// Kept apart from pinyin.ts so screens can use it without loading pinyin-pro.
export function syllableKey(marked: string): string {
  return `${stripTones(marked).replace(/ü/g, 'v')}${toneOf(marked)}`;
}
