import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import ToneShape from '../components/ToneShape';
import { playKey } from '../lib/audio';
import { INITIALS, parseKey } from '../lib/pinyin';
import { boop, buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

const ROUNDS = 4;
const FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ian', 'in', 'ing', 'uo', 'ui', 'iu', 'ie', 'un', 'uan'];

// Pinyin Train: hear a learned character and load the initial, final and tone cars.
export default function PinyinTrain({ index, learned, onDone }: GameProps) {
  const targets = useMemo(() => Array.from({ length: ROUNDS }, (_, i) => shuffle(learned)[i % learned.length]), [learned]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [cars, setCars] = useState<{ initial?: string; final?: string; tone?: number }>({});
  // The train drives off after a right answer; each round gets a fresh train.
  const [leaving, setLeaving] = useState(false);
  const char = targets[round];
  const key = char ? syllableKey(index.chars[char].pinyin) : '';
  const want = key ? parseKey(key) : { initial: '', final: '', tone: 0 };

  const options = useMemo(
    () =>
      key
        ? {
            initial: shuffle([want.initial || '–', ...shuffle(INITIALS.filter((i) => i !== want.initial)).slice(0, 2)]),
            final: shuffle([want.final, ...shuffle(FINALS.filter((f) => f !== want.final)).slice(0, 2)]),
          }
        : null,
    [key],
  );

  useEffect(() => {
    if (round >= ROUNDS) {
      onDone(score, ROUNDS);
      return;
    }
    setCars({});
    setMissed(false);
    const t = setTimeout(() => playKey(key), 300);
    return () => clearTimeout(t);
  }, [round]);

  const load = (part: 'initial' | 'final' | 'tone', value: string | number) => {
    if (leaving) return;
    const next = { ...cars, [part]: value };
    setCars(next);
    if (next.initial === undefined || next.final === undefined || next.tone === undefined) return;
    const right = (next.initial === '–' ? '' : next.initial) === want.initial && next.final === want.final && next.tone === want.tone;
    if (right) {
      chime();
      buzz();
      playKey(key);
      if (!missed) setScore((s) => s + 1);
      setLeaving(true);
      setTimeout(() => {
        setLeaving(false);
        setRound((r) => r + 1);
      }, 1300);
    } else {
      boop();
      setMissed(true);
      // Keep the cars that are right; empty the others.
      setCars({
        initial: next.initial === (want.initial || '–') ? next.initial : undefined,
        final: next.final === want.final ? next.final : undefined,
        tone: next.tone === want.tone ? next.tone : undefined,
      });
      playKey(key);
    }
  };

  if (round >= ROUNDS || !options) return null;

  const row = 'flex flex-wrap justify-center gap-2';
  const piece = 'flex min-h-14 min-w-14 items-center justify-center rounded-2xl bg-white px-2 text-2xl font-semibold shadow-md active:scale-95';
  return (
    <div className="flex flex-col items-center gap-4 overflow-hidden">
      <button type="button" onClick={() => playKey(key)} aria-label="Listen again" className="flex size-16 items-center justify-center rounded-full bg-white text-3xl shadow-md active:scale-95">
        👂
      </button>
      <motion.div
        key={round}
        animate={{ x: leaving ? 400 : 0 }}
        transition={{ duration: 1.2, ease: 'easeIn' }}
        className="flex items-end gap-2"
        aria-label="Train"
      >
        <span className="text-5xl">🚂</span>
        {(['initial', 'final', 'tone'] as const).map((part) => (
          <div role="group" key={part} aria-label={`${part} car`} className="flex size-20 items-center justify-center rounded-xl border-4 border-dashed border-[#d9c7a3] bg-[#fff9db] text-3xl font-semibold">
            {part === 'tone' ? cars.tone && <ToneShape tone={cars.tone} width={56} /> : cars[part]}
          </div>
        ))}
      </motion.div>
      <div className={row}>
        {options.initial.map((v) => (
          <button key={v} type="button" onClick={() => load('initial', v)} aria-label={`Initial ${v}`} className={piece}>
            {v}
          </button>
        ))}
      </div>
      <div className={row}>
        {options.final.map((v) => (
          <button key={v} type="button" onClick={() => load('final', v)} aria-label={`Final ${v}`} className={piece}>
            {v}
          </button>
        ))}
      </div>
      <div className={row}>
        {[1, 2, 3, 4].map((t) => (
          <button key={t} type="button" onClick={() => load('tone', t)} aria-label={`Tone ${t}`} className={piece}>
            <ToneShape tone={t} width={44} />
          </button>
        ))}
      </div>
    </div>
  );
}
