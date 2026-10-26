import { motion, type TargetAndTransition } from 'framer-motion';
import type { ReactNode } from 'react';

export type Mood = 'happy' | 'cheer' | 'wobble' | 'sleep';

// Bǎobao, the app's own mascot: a small panda gardener in a straw hat with a
// sprout on top and a green apron. Original artwork, drawn here as SVG.
export default function Baobao({ mood = 'happy', size = 140 }: { mood?: Mood; size?: number }) {
  const motionFor: Record<Mood, TargetAndTransition> = {
    happy: { y: [0, -4, 0], transition: { duration: 2.4, repeat: Infinity } },
    cheer: { y: [0, -18, 0, -10, 0], transition: { duration: 0.9 } },
    // A funny wobble for mistakes, never disappointment.
    wobble: { rotate: [0, -8, 8, -5, 5, 0], transition: { duration: 0.7 } },
    sleep: { rotate: [0, 2, 0], transition: { duration: 3, repeat: Infinity } },
  };
  const ink = '#2b2b2b';
  const asleep = mood === 'sleep';

  return (
    <motion.svg key={mood} width={size} height={size * 1.1} viewBox="0 -12 200 232" animate={motionFor[mood]} role="img" aria-label="Bǎobao">
      {/* Body and apron */}
      <ellipse cx="100" cy="165" rx="58" ry="48" fill="#fff" stroke={ink} strokeWidth="3" />
      <path d="M68 140 Q100 132 132 140 L126 200 Q100 210 74 200 Z" fill="#8ccf7e" />
      <rect x="88" y="168" width="24" height="16" rx="4" fill="#5fae58" />
      {/* Arms: up when cheering */}
      {mood === 'cheer' ? (
        <>
          <ellipse cx="40" cy="118" rx="14" ry="26" fill={ink} transform="rotate(-30 40 118)" />
          <ellipse cx="160" cy="118" rx="14" ry="26" fill={ink} transform="rotate(30 160 118)" />
        </>
      ) : (
        <>
          <ellipse cx="46" cy="165" rx="14" ry="24" fill={ink} transform="rotate(20 46 165)" />
          <ellipse cx="154" cy="165" rx="14" ry="24" fill={ink} transform="rotate(-20 154 165)" />
        </>
      )}
      <ellipse cx="72" cy="208" rx="18" ry="11" fill={ink} />
      <ellipse cx="128" cy="208" rx="18" ry="11" fill={ink} />
      {/* Head */}
      <circle cx="58" cy="52" r="17" fill={ink} />
      <circle cx="142" cy="52" r="17" fill={ink} />
      <circle cx="100" cy="88" r="54" fill="#fff" stroke={ink} strokeWidth="3" />
      <ellipse cx="78" cy="88" rx="13" ry="17" fill={ink} transform="rotate(20 78 88)" />
      <ellipse cx="122" cy="88" rx="13" ry="17" fill={ink} transform="rotate(-20 122 88)" />
      {asleep ? (
        <path d="M71 90 q7 5 14 0 M115 90 q7 5 14 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="80" cy="88" r="5" fill="#fff" />
          <circle cx="120" cy="88" r="5" fill="#fff" />
        </>
      )}
      <ellipse cx="100" cy="106" rx="7" ry="5" fill={ink} />
      {mood === 'cheer' ? (
        <path d="M88 114 Q100 132 112 114 Z" fill="#e8590c" />
      ) : mood === 'wobble' ? (
        <path d="M90 120 q5 -5 10 0 q5 5 10 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M90 116 Q100 126 110 116" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      <circle cx="66" cy="108" r="7" fill="#ff8fa3" opacity=".6" />
      <circle cx="134" cy="108" r="7" fill="#ff8fa3" opacity=".6" />
      {/* Straw hat with a sprout */}
      <ellipse cx="100" cy="42" rx="62" ry="12" fill="#f2c46d" stroke="#c99a3a" strokeWidth="2" />
      <path d="M70 42 Q72 14 100 12 Q128 14 130 42 Z" fill="#f2c46d" stroke="#c99a3a" strokeWidth="2" />
      <rect x="71" y="32" width="58" height="8" fill="#5fae58" />
      <path d="M100 12 V0" stroke="#5fae58" strokeWidth="3" />
      <path d="M100 4 Q88 -6 82 4 Q92 8 100 4 Z M100 4 Q112 -6 118 4 Q108 8 100 4 Z" fill="#8ccf7e" />
      {asleep && (
        <text x="150" y="40" fontSize="22" fill="#868e96">
          z z
        </text>
      )}
    </motion.svg>
  );
}

// Bǎobao saying something: Chinese with pinyin above it, and the English small.
export function Speech({ han, pinyin, english, children }: { han: string; pinyin: string; english?: string; children?: ReactNode }) {
  return (
    <div className="relative rounded-3xl bg-white px-5 py-3 text-center shadow-md" aria-live="polite">
      <p className="text-base">{pinyin}</p>
      <p className="han text-3xl font-bold">{han}</p>
      {english && <p className="text-sm text-ink/50">{english}</p>}
      {children}
    </div>
  );
}
