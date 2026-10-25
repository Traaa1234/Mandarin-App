import { convert } from 'pinyin-pro';
import { stripTones } from './ids';
import { toneOf } from './tones';

// Recordings are named like audio-cmn's files: syllable without marks, ü as v,
// then the tone number (5 = neutral). 'hǎo' → 'hao3', 'nǚ' → 'nv3'.
export function syllableKey(marked: string): string {
  return `${stripTones(marked).replace(/ü/g, 'v')}${toneOf(marked)}`;
}

// Tone-marked display form of a key: 'lv4' → 'lǜ'.
export const keyToMarked = (key: string) => convert(key.replace(/5$/, '0'));

// Longest first, so zh wins over z.
export const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];

// Split a key into the parts a child builds it from. The final is shown with ü.
export function parseKey(key: string): { initial: string; final: string; tone: number } {
  const tone = Number(key.slice(-1));
  const base = key.slice(0, -1);
  const initial = INITIALS.find((i) => base.startsWith(i) && base.length > i.length) ?? '';
  return { initial, final: base.slice(initial.length).replace(/v/g, 'ü'), tone };
}

// The reverse: j, q, x and y write ü as u; elsewhere ü is spelled v in keys.
export function buildKey(initial: string, final: string, tone: number): string {
  const spelled = ['j', 'q', 'x', 'y'].includes(initial) ? final.replace(/ü/g, 'u') : final.replace(/ü/g, 'v');
  return `${initial}${spelled}${tone}`;
}
