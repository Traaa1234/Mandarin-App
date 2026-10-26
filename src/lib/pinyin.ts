import { convert } from 'pinyin-pro';
import { stripTones } from './ids';

export { syllableKey } from './syllable';

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

// Split written pinyin into syllables: 'shénme míngzi' → ['shén', 'me', 'míng', 'zi'].
// `bases` holds every valid syllable without tone ('shen', 'me', 'lv'…). Longest
// match first, backing up when the rest can't be split (xi'an vs xian).
export function splitSyllables(text: string, bases: Set<string>): string[] {
  const out: string[] = [];
  for (const chunk of text.toLowerCase().split(/[\s'’,.!?…，。！？]+/).filter(Boolean)) {
    const letters = Array.from(chunk);
    const plain = letters.map((ch) => stripTones(ch).replace('ü', 'v'));
    const solve = (from: number): string[] | null => {
      if (from === letters.length) return [];
      for (let end = Math.min(letters.length, from + 6); end > from; end--) {
        if (!bases.has(plain.slice(from, end).join(''))) continue;
        const rest = solve(end);
        if (rest) return [letters.slice(from, end).join(''), ...rest];
      }
      return null;
    };
    const parts = solve(0);
    if (!parts) throw new Error(`Cannot split pinyin "${chunk}"`);
    out.push(...parts);
  }
  return out;
}

// Tones as spoken: in a run of 3rd tones, all but the last become 2nd tones
// (nǐ hǎo is said ní hǎo). 一 and 不 are already written in their changed form.
export function spokenTones(tones: number[]): number[] {
  const out = [...tones];
  for (let i = out.length - 2; i >= 0; i--) {
    if (tones[i] === 3 && tones[i + 1] === 3) out[i] = 2;
  }
  return out;
}
