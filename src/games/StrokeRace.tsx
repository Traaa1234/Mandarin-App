import HanziWriter from 'hanzi-writer';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import TianGrid from '../components/TianGrid';
import { charDataLoader } from '../data/load';
import { INK, OUTLINE } from '../lib/colors';
import { buzz, chime } from '../lib/sfx';
import { leniencyFor, useSettings } from '../practice/settings';
import { store } from '../practice/store';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

const SIZE = 280;

// Stroke Race: trace a learned character and beat your own best time, shown as
// a ghost racing along the track.
export default function StrokeRace({ learned, profileId, onDone }: GameProps) {
  const char = useMemo(() => shuffle(learned)[0], [learned]);
  const leniency = leniencyFor(useSettings().settings);
  const svgRef = useRef<SVGSVGElement>(null);
  const [best, setBest] = useState<number | null | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ seconds: number; record: boolean } | null>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    store.getMeta<number | null>(profileId, `best:${char}`, null).then(setBest);
  }, [char, profileId]);

  useEffect(() => {
    if (best === undefined) return;
    const svg = svgRef.current!;
    const keep = svg.childNodes.length;
    const started = performance.now();
    const writer = HanziWriter.create(svg as unknown as HTMLElement, char, {
      width: SIZE,
      height: SIZE,
      padding: SIZE * 0.06,
      charDataLoader,
      showCharacter: false,
      showOutline: true,
      strokeColor: INK,
      outlineColor: OUTLINE,
      drawingWidth: 20,
    });
    writer.quiz({
      leniency,
      showHintAfterMisses: 2,
      onCorrectStroke: ({ strokeNum, strokesRemaining }) => {
        buzz(10);
        setProgress((strokeNum + 1) / (strokeNum + 1 + strokesRemaining));
      },
      onComplete: async () => {
        const seconds = Math.round((performance.now() - started) / 100) / 10;
        const record = best === null || seconds < best;
        if (record) await store.setMeta(profileId, `best:${char}`, seconds);
        chime();
        setResult({ seconds, record });
        setTimeout(() => done.current(record ? 1 : 0, 1), 1800);
      },
    });
    return () => {
      writer.cancelQuiz();
      while (svg.childNodes.length > keep) svg.removeChild(svg.lastChild!);
    };
  }, [char, best, profileId, leniency]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div role="group" className="relative h-12 w-full max-w-sm rounded-full bg-[#e9dfcc]" aria-label="Race track">
        {best && !result && (
          <motion.span className="absolute top-1 text-3xl" initial={{ left: '0%' }} animate={{ left: '88%' }} transition={{ duration: best, ease: 'linear' }} aria-label={`Ghost: your best is ${best} seconds`}>
            👻
          </motion.span>
        )}
        <motion.span className="absolute top-1 text-3xl" animate={{ left: `${progress * 88}%` }} aria-hidden="true">
          🐼
        </motion.span>
        <span className="absolute top-2 right-2 text-2xl" aria-hidden="true">
          🏁
        </span>
      </div>
      <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="touch-none" role="img" aria-label={`Write ${char}`}>
        <TianGrid size={SIZE} />
      </svg>
      <p className="min-h-10 text-2xl" aria-live="polite">
        {result ? `${result.record ? '🏆 ' : ''}${result.seconds}s` : best ? `👻 ${best}s` : ''}
      </p>
    </div>
  );
}
