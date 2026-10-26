import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import type { DataIndex } from '../data/types';
import { playKey } from '../lib/audio';
import { boop, buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { shuffle } from '../practice/cards/useChoice';

const ROUNDS = 5;
const BALLOONS = ['#ff8fa3', '#74c0fc', '#ffd43b', '#8ccf7e'];

// Character Catch: characters float down as balloons; pop the one Bǎobao says.
// Uses only characters the child has learned. Five rounds, about a minute.
export default function CharacterCatch({ chars, index, onDone }: { chars: string[]; index: DataIndex; onDone: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [popped, setPopped] = useState<string | null>(null);

  const targets = useMemo(() => Array.from({ length: ROUNDS }, (_, i) => shuffle(chars)[i % chars.length]), [chars]);
  const target = targets[round];
  const balloons = useMemo(
    () => (target ? shuffle([target, ...shuffle(chars.filter((c) => c !== target)).slice(0, 2)]) : []),
    [target, chars],
  );
  const say = () => target && playKey(syllableKey(index.chars[target].pinyin));

  useEffect(() => {
    if (round >= ROUNDS) {
      onDone(score);
      return;
    }
    setMissed(false);
    const t = setTimeout(say, 400);
    return () => clearTimeout(t);
    // Say the new target once per round.
  }, [round]);

  const tap = (c: string) => {
    if (popped) return;
    if (c === target) {
      chime();
      buzz();
      setPopped(c);
      if (!missed) setScore((s) => s + 1);
      setTimeout(() => {
        setPopped(null);
        setRound((r) => r + 1);
      }, 700);
    } else {
      // A soft boop and Bǎobao says it again; the balloons keep floating.
      boop();
      setMissed(true);
      say();
    }
  };

  if (round >= ROUNDS) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={say}
        aria-label="Listen again"
        className="flex size-16 items-center justify-center rounded-full bg-white text-3xl shadow-md active:scale-95"
      >
        👂
      </button>
      <div className="relative h-96 w-full max-w-md overflow-hidden rounded-3xl bg-[#dff1ff]" aria-label={`Round ${round + 1} of ${ROUNDS}`}>
        {balloons.map((c, i) => (
          <motion.button
            key={`${round}-${c}`}
            type="button"
            onClick={() => tap(c)}
            aria-label={c}
            className="absolute flex size-24 flex-col items-center"
            style={{ left: `${8 + i * 31}%` }}
            initial={{ y: -110 }}
            animate={popped === c ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] } : { y: [-110, 390] }}
            transition={popped === c ? { duration: 0.4 } : { duration: 7 + i, repeat: Infinity, ease: 'linear', delay: i * 0.6 }}
          >
            <span
              className="han flex size-20 items-center justify-center rounded-full text-5xl shadow-md"
              style={{ background: BALLOONS[i % BALLOONS.length] }}
            >
              {c}
            </span>
            <span className="h-6 w-px bg-ink/40" />
          </motion.button>
        ))}
      </div>
      <p className="text-2xl" aria-label={`${score} caught`}>
        {'🎈'.repeat(score)}
      </p>
    </div>
  );
}
