import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { playKey } from '../lib/audio';
import { boop, buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

const ROUNDS = 2;
const COPIES = 3;
const DECOR = ['🌸', '🍃', '🐞', '🦋', '🌼', '🍄', '🐌', '🌿'];

// Hidden Hanzi: find the 3 hidden copies of a root in a garden scene.
export default function HiddenHanzi({ index, learned, onDone }: GameProps) {
  const roots = learned.filter((c) => index.chars[c].role !== 'compound');
  const targets = useMemo(() => shuffle(roots.length >= 2 ? roots : learned).slice(0, ROUNDS), [learned]);
  const [round, setRound] = useState(0);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const target = targets[round];

  // Twenty cells; each item gets one, with a little jitter, turn and size.
  const scene = useMemo(() => {
    if (!target) return [];
    const others = shuffle(learned.filter((c) => c !== target)).slice(0, 5);
    const items = [
      ...Array.from({ length: COPIES }, () => ({ text: target, han: true })),
      ...others.map((c) => ({ text: c, han: true })),
      ...shuffle(DECOR).map((d) => ({ text: d, han: false })),
    ];
    const cells = shuffle(Array.from({ length: 20 }, (_, i) => i));
    return items.map((item, i) => ({
      ...item,
      left: (cells[i] % 4) * 25 + 4 + Math.random() * 8,
      top: Math.floor(cells[i] / 4) * 20 + 3 + Math.random() * 6,
      rotate: Math.round(Math.random() * 50 - 25),
      size: 26 + Math.round(Math.random() * 16),
    }));
  }, [target]);

  if (!target) return null;

  const tap = (i: number) => {
    const item = scene[i];
    if (found.has(i)) return;
    if (item.text !== target) {
      if (item.han) {
        boop();
        setMissed(true);
      }
      return;
    }
    chime();
    buzz();
    const next = new Set(found).add(i);
    setFound(next);
    if (next.size === COPIES) {
      playKey(syllableKey(index.chars[target].pinyin));
      const points = score + (missed ? 0 : 1);
      setScore(points);
      setTimeout(() => {
        if (round + 1 >= ROUNDS) onDone(points, ROUNDS);
        else {
          setRound((r) => r + 1);
          setFound(new Set());
          setMissed(false);
        }
      }, 1200);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="flex items-center gap-3 text-2xl">
        <span lang="zh-Hans" className="han text-5xl">{target}</span>
        <span aria-label={`${found.size} of ${COPIES} found`}>{Array.from({ length: COPIES }, (_, i) => (i < found.size ? '✅' : '⬜')).join('')}</span>
      </p>
      <div role="group" className="relative h-[26rem] w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#dff1ff] to-[#c3e6b4]" aria-label="Garden scene">
        {scene.map((item, i) => (
          <motion.button
            key={`${round}-${i}`}
            type="button"
            onClick={() => tap(i)}
            aria-label={item.han ? item.text : 'Decoration'}
            className={`absolute flex min-h-14 min-w-14 items-center justify-center rounded-full ${found.has(i) ? 'ring-4 ring-[#f59f00]' : ''}`}
            style={{ left: `${item.left}%`, top: `${item.top}%`, rotate: item.rotate, fontSize: item.size }}
            animate={found.has(i) ? { scale: [1, 1.4, 1.15] } : {}}
          >
            <span className={item.han ? 'han text-ink/80' : ''}>{item.text}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
