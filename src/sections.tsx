import type { ReactNode } from 'react';

export type SectionId = 'roots' | 'pictures' | 'speak' | 'pinyin';

export interface Section {
  id: SectionId;
  // Shown large in Chinese, with pinyin; English stays small for parents.
  han: string;
  pinyin: string;
  english: string;
  color: string;
  icon: ReactNode;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const SECTIONS: Section[] = [
  {
    id: 'roots',
    han: '字根',
    pinyin: 'zì gēn',
    english: 'Character Roots',
    color: 'bg-[#ffe8a3] text-[#7a4b00]',
    icon: (
      // A sprout with roots.
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path {...stroke} d="M50 58 V30" />
        <path {...stroke} d="M50 40 C38 40 28 32 26 18 C40 18 50 26 50 40" />
        <path {...stroke} d="M50 34 C60 34 70 26 72 14 C60 14 50 22 50 34" />
        <path {...stroke} d="M18 60 H82" />
        <path {...stroke} d="M50 60 V84 M50 68 L36 82 M50 68 L64 82" />
      </svg>
    ),
  },
  {
    id: 'pictures',
    han: '图卡',
    pinyin: 'tú kǎ',
    english: 'Picture Cards',
    color: 'bg-[#cdeffd] text-[#0b5a7a]',
    icon: (
      // A picture card with a sun over a mountain.
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <rect {...stroke} x="14" y="20" width="72" height="60" rx="10" />
        <circle {...stroke} cx="66" cy="38" r="7" />
        <path {...stroke} d="M20 72 L42 46 L58 64 L66 56 L80 72" />
      </svg>
    ),
  },
  {
    id: 'speak',
    han: '说话',
    pinyin: 'shuō huà',
    english: 'Speak Mandarin',
    color: 'bg-[#ffd6d6] text-[#8a1c1c]',
    icon: (
      // A speech bubble with sound waves.
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path {...stroke} d="M18 24 H72 a8 8 0 0 1 8 8 V58 a8 8 0 0 1 -8 8 H42 L26 80 V66 H18 a8 8 0 0 1 -8 -8 V32 a8 8 0 0 1 8 -8 Z" />
        <path {...stroke} d="M30 45 H34 M42 38 V52 M52 34 V56 M62 40 V50" />
      </svg>
    ),
  },
  {
    id: 'pinyin',
    han: '拼音',
    pinyin: 'pīn yīn',
    english: 'Pinyin Playground',
    color: 'bg-[#d8f5d0] text-[#225c14]',
    icon: (
      // The four tone shapes: flat, rising, dip, falling.
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path {...stroke} d="M14 26 H40" />
        <path {...stroke} d="M60 40 L86 18" />
        <path {...stroke} d="M14 62 Q27 90 40 62" />
        <path {...stroke} d="M60 60 L86 84" />
      </svg>
    ),
  },
];
