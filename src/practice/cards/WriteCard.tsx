import HanziWriter from 'hanzi-writer';
import { useEffect, useRef } from 'react';
import TianGrid from '../../components/TianGrid';
import { useBoxSize } from '../../components/useBoxSize';
import { charDataLoader } from '../../data/load';
import type { DataIndex } from '../../data/types';
import { playKey } from '../../lib/audio';
import { INK, OUTLINE } from '../../lib/colors';
import { buzz, chime } from '../../lib/sfx';
import { syllableKey } from '../../lib/syllable';
import { toneClass } from '../../lib/tones';
import type { Outcome } from '../rating';

// Write it: trace the character on the 田字格 grid with Hanzi Writer's quiz.
// Leniency 1.5 suits ages 5–7 (1.0 for older children); a hint shows after 2
// misses on a stroke; the drawn line is about 20 px wide for small fingers.
export default function WriteCard({
  char,
  index,
  leniency = 1.5,
  outline = true,
  onDone,
}: {
  char: string;
  index: DataIndex;
  leniency?: number;
  // Off for the harder version: trace from memory.
  outline?: boolean;
  onDone: (o: Outcome) => void;
}) {
  const size = useBoxSize(320);
  const svgRef = useRef<SVGSVGElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const entry = index.chars[char];

  useEffect(() => {
    const svg = svgRef.current!;
    const keep = svg.childNodes.length;
    const started = performance.now();
    const writer = HanziWriter.create(svg as unknown as HTMLElement, char, {
      width: size,
      height: size,
      padding: size * 0.06,
      charDataLoader,
      showCharacter: false,
      showOutline: outline,
      strokeColor: INK,
      outlineColor: OUTLINE,
      drawingWidth: 20,
    });
    writer.quiz({
      leniency,
      showHintAfterMisses: 2,
      onCorrectStroke: () => buzz(10),
      onComplete: ({ totalMistakes }) => {
        chime();
        setTimeout(
          () => done.current({ retries: 0, helped: false, ms: performance.now() - started, writeMistakes: totalMistakes }),
          900,
        );
      },
    });
    return () => {
      writer.cancelQuiz();
      while (svg.childNodes.length > keep) svg.removeChild(svg.lastChild!);
    };
  }, [char, size, leniency, outline]);

  return (
    <div className="flex flex-col items-center gap-4">
      <button type="button" onClick={() => playKey(syllableKey(entry.pinyin))} aria-label="Listen" className="flex items-center gap-2 text-3xl">
        <span className={'py ' + toneClass(entry.pinyin)}>{entry.pinyin}</span> 🔊
      </button>
      <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="touch-none" role="img" aria-label={`Write ${char}`}>
        <TianGrid size={size} />
      </svg>
    </div>
  );
}
