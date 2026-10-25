// Pinyin for stroke names, built from their syllables: 横折钩 → héngzhégōu.
const SYLLABLES: Record<string, string> = {
  横: 'héng',
  竖: 'shù',
  撇: 'piě',
  捺: 'nà',
  点: 'diǎn',
  提: 'tí',
  折: 'zhé',
  钩: 'gōu',
  弯: 'wān',
  卧: 'wò',
  斜: 'xié',
};

export function strokePinyin(name: string): string {
  return Array.from(name)
    .map((ch) => SYLLABLES[ch] ?? '')
    .join('');
}
