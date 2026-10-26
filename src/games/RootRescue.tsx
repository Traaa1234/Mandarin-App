import { motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import TianGrid from '../components/TianGrid';
import { loadChar } from '../data/load';
import type { CharData } from '../data/types';
import { playKey } from '../lib/audio';
import { OUTLINE, partColor } from '../lib/colors';
import { leafPaths, strokeLeaves } from '../lib/ids';
import { buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

const SECONDS = 30;
const BOX = 240;
const PIECE = 104;

// Root Rescue: a learned compound has fallen apart. Drag (or tap) each part back
// into place before the timer flower closes.
export default function RootRescue({ index, learned, onDone }: GameProps) {
  const chars = useMemo(() => shuffle(learned.filter((c) => index.chars[c].role === 'compound')).slice(0, 3), [learned, index]);
  const [round, setRound] = useState(0);
  const [data, setData] = useState<CharData | null>(null);
  const [placed, setPlaced] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (round >= chars.length) {
      onDone(score, chars.length);
      return;
    }
    setData(null);
    setPlaced(new Set());
    setTimeUp(false);
    loadChar(chars[round]).then(setData);
    const t = setTimeout(() => setTimeUp(true), SECONDS * 1000);
    return () => clearTimeout(t);
  }, [round]);

  const parts = useMemo(() => {
    if (!data) return [];
    const leaves = leafPaths(data.decomposition);
    const strokeLeaf = strokeLeaves(data.matches, leaves);
    return leaves.map((_, i) => strokeLeaf.flatMap((l, s) => (l === i ? [s] : [])));
  }, [data]);

  // When time runs out, the missing parts float in by themselves: no point, no fuss.
  useEffect(() => {
    if (timeUp && data && placed.size < parts.length) {
      setPlaced(new Set(parts.map((_, i) => i)));
      setTimeout(() => setRound((r) => r + 1), 1800);
    }
  }, [timeUp]);

  const place = (i: number) => {
    if (placed.has(i) || timeUp || !data) return;
    const next = new Set(placed).add(i);
    setPlaced(next);
    buzz(10);
    if (next.size === parts.length) {
      chime();
      playKey(syllableKey(data.pinyin));
      setScore((s) => s + 1);
      setTimeout(() => setRound((r) => r + 1), 1500);
    }
  };

  const dropped = (i: number) => (_: unknown, info: PanInfo) => {
    const r = box.current?.getBoundingClientRect();
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    if (r && x > r.left && x < r.right && y > r.top && y < r.bottom) place(i);
  };

  if (!data || round >= chars.length) return null;
  const strokesSvg = (size: number, only: number[] | null, color: (s: number) => string) => {
    const { transform } = HanziWriter.getScalingTransform(size, size, size * 0.06);
    return (
      <g transform={transform}>
        {data.strokes.map((d, s) => (only === null || only.includes(s) ? <path key={s} d={d} fill={color(s)} /> : null))}
      </g>
    );
  };
  const owner = (s: number) => parts.findIndex((p) => p.includes(s));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <motion.span
          key={round}
          className="text-4xl"
          initial={{ scale: 1, rotate: 0 }}
          animate={{ scale: 0.3, rotate: 180 }}
          transition={{ duration: SECONDS, ease: 'linear' }}
          aria-label="Timer flower"
        >
          🌼
        </motion.span>
        <span className="text-sm text-ink/70">
          {round + 1} / {chars.length}
        </span>
      </div>
      <div role="group" ref={box} aria-label={`Put ${data.character} back together`}>
        <svg width={BOX} height={BOX} viewBox={`0 0 ${BOX} ${BOX}`}>
          <TianGrid size={BOX} />
          {strokesSvg(BOX, null, (s) => (placed.has(owner(s)) ? partColor(owner(s)) : OUTLINE))}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {parts.map((strokes, i) =>
          placed.has(i) ? null : (
            <motion.button
              key={`${round}-${i}`}
              type="button"
              drag
              dragSnapToOrigin
              whileDrag={{ scale: 1.1, zIndex: 20 }}
              onTap={() => place(i)}
              onDragEnd={dropped(i)}
              aria-label={`Part ${i + 1}`}
              className="touch-none rounded-2xl bg-white shadow-md"
            >
              <svg width={PIECE} height={PIECE} viewBox={`0 0 ${PIECE} ${PIECE}`}>
                {strokesSvg(PIECE, strokes, () => partColor(i))}
              </svg>
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}
