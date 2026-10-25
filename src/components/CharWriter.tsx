import HanziWriter from 'hanzi-writer';
import { useEffect, useRef } from 'react';
import { charDataLoader } from '../data/load';
import { INK, OUTLINE, RADICAL } from '../lib/colors';
import TianGrid from './TianGrid';

// Hanzi Writer drawing into an SVG that already holds the 田字格 grid.
export default function CharWriter({
  char,
  size,
  speed = 1,
  onWriter,
  label,
}: {
  char: string;
  size: number;
  speed?: number;
  onWriter: (writer: HanziWriter | null) => void;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const onWriterRef = useRef(onWriter);
  onWriterRef.current = onWriter;

  useEffect(() => {
    const svg = svgRef.current!;
    const keep = svg.childNodes.length;
    const writer = HanziWriter.create(svg as unknown as HTMLElement, char, {
      width: size,
      height: size,
      padding: size * 0.06,
      charDataLoader,
      strokeAnimationSpeed: speed,
      delayBetweenStrokes: 250,
      strokeColor: INK,
      radicalColor: RADICAL,
      outlineColor: OUTLINE,
      showOutline: true,
    });
    onWriterRef.current(writer);
    return () => {
      onWriterRef.current(null);
      writer.pauseAnimation().catch(() => {});
      // Remove what Hanzi Writer added, keep the grid.
      while (svg.childNodes.length > keep) svg.removeChild(svg.lastChild!);
    };
  }, [char, size, speed]);

  return (
    <svg ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <TianGrid size={size} />
    </svg>
  );
}
