import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { TONE_PATHS } from '../components/ToneShape';
import { playKey } from '../lib/audio';
import { TONE_COLORS } from '../lib/colors';
import { boop, buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { toneOf } from '../lib/tones';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

const ROUNDS = 5;

// Tone Surfer: hear a learned character, ride the wave whose shape matches its tone.
export default function ToneSurfer({ index, learned, onDone }: GameProps) {
  const chars = useMemo(() => Array.from({ length: ROUNDS }, (_, i) => shuffle(learned)[i % learned.length]), [learned]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [riding, setRiding] = useState<number | null>(null);
  const char = chars[round];
  const pinyin = char ? index.chars[char].pinyin : '';
  const say = () => char && playKey(syllableKey(pinyin));

  useEffect(() => {
    if (round >= ROUNDS) {
      onDone(score, ROUNDS);
      return;
    }
    setMissed(false);
    const t = setTimeout(say, 300);
    return () => clearTimeout(t);
  }, [round]);

  const ride = (t: number) => {
    if (riding) return;
    if (t !== toneOf(pinyin)) {
      boop();
      setMissed(true);
      say();
      return;
    }
    chime();
    buzz();
    if (!missed) setScore((s) => s + 1);
    setRiding(t);
    setTimeout(() => {
      setRiding(null);
      setRound((r) => r + 1);
    }, 1400);
  };

  if (round >= ROUNDS) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <button type="button" onClick={say} aria-label="Listen again" className="flex size-20 items-center justify-center rounded-full bg-white text-4xl shadow-md active:scale-95">
        {riding ? <span lang="zh-Hans" className="han">{char}</span> : '👂'}
      </button>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((t) => (
          <button key={t} type="button" onClick={() => ride(t)} aria-label={`Wave ${t}`} className="rounded-3xl bg-[#d0ebff] p-2 shadow-md active:scale-95">
            <svg viewBox="0 0 100 60" className="w-full" aria-hidden="true">
              <path d={`${TONE_PATHS[t]} L 90 60 L 10 60 Z`} fill="#74c0fc" opacity=".5" />
              <path d={TONE_PATHS[t]} stroke={TONE_COLORS[t]} strokeWidth="6" fill="none" strokeLinecap="round" />
              {riding === t && (
                <text fontSize="20" textAnchor="middle">
                  🏄
                  <animateMotion dur="1.2s" fill="freeze" path={TONE_PATHS[t]} />
                </text>
              )}
            </svg>
          </button>
        ))}
      </div>
      <motion.p className="text-2xl" aria-label={`${score} waves ridden`}>
        {'🌊'.repeat(score)}
      </motion.p>
    </div>
  );
}
