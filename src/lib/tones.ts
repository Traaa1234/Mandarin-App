// Tone of one pinyin syllable from its tone mark: 1–4, or 5 for the neutral tone.
const MARKS: Record<string, 1 | 2 | 3 | 4> = {
  '̄': 1, // ā
  '́': 2, // á
  '̌': 3, // ǎ
  '̀': 4, // à
};

export function toneOf(syllable: string): 1 | 2 | 3 | 4 | 5 {
  for (const ch of syllable.normalize('NFD')) {
    const tone = MARKS[ch];
    if (tone) return tone;
  }
  return 5;
}

// Spelled out in full so Tailwind finds the class names.
const TONE_TEXT = ['', 'text-tone-1', 'text-tone-2', 'text-tone-3', 'text-tone-4', 'text-tone-5'];

export const toneClass = (syllable: string) => TONE_TEXT[toneOf(syllable)];
