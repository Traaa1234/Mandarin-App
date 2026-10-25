import HanziWriter from 'hanzi-writer';
import type { ReactNode } from 'react';
import TianGrid from './TianGrid';

// Draws a character's strokes straight from its data, one color per stroke
// (null hides a stroke). Used where Hanzi Writer's own renderer can't do the
// job: stroke fanning and coloring strokes by part.
export default function StrokeSvg({
  strokes,
  colors,
  size,
  grid = true,
  label,
  children,
}: {
  strokes: string[];
  colors: (string | null)[];
  size: number;
  grid?: boolean;
  label?: string;
  children?: ReactNode;
}) {
  // The source data's y axis points up; this transform flips it into SVG space.
  const { transform } = HanziWriter.getScalingTransform(size, size, size * 0.06);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {grid && <TianGrid size={size} />}
      <g transform={transform}>
        {strokes.map((d, i) => (colors[i] ? <path key={i} d={d} fill={colors[i]!} /> : null))}
      </g>
      {children}
    </svg>
  );
}
