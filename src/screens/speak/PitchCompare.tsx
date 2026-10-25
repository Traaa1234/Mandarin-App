import type { PhraseSyllable } from '../../data/types';
import { TONE_COLORS } from '../../lib/colors';
import { CONTOUR_POINTS } from '../../lib/pitch';

const W = 90;
const H = 70;
// Semitones shown above and below the speaker's middle pitch.
const RANGE = 9;

const line = (values: number[]) =>
  values
    .map((v, i) => {
      const x = 6 + (i / (CONTOUR_POINTS - 1)) * (W - 12);
      const y = H / 2 - (Math.max(-RANGE, Math.min(RANGE, v)) / RANGE) * (H / 2 - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

// Two pitch lines per syllable, one syllable at a time: the model voice (thin,
// dashed) and the child's (bold), both in the syllable's tone color.
export default function PitchCompare({
  syllables,
  model,
  child,
  stars,
}: {
  syllables: PhraseSyllable[];
  model: (number[] | null)[];
  child: (number[] | null)[];
  stars: number[];
}) {
  return (
    <ol className="flex flex-wrap justify-center gap-2" aria-label="Your voice and the model voice">
      {syllables.map((s, i) => {
        const color = TONE_COLORS[s.spokenTone];
        return (
          <li key={i} className="flex flex-col items-center rounded-2xl bg-white p-2 shadow-sm">
            <span className="text-xl font-semibold" style={{ color }}>
              {s.written}
            </span>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              <line x1={4} x2={W - 4} y1={H / 2} y2={H / 2} stroke="#eee" />
              {model[i] && (
                <polyline points={line(model[i]!)} fill="none" stroke={color} strokeOpacity={0.55} strokeWidth={3} strokeDasharray="5 4" strokeLinecap="round" />
              )}
              {child[i] && (
                <polyline points={line(child[i]!)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            <span className="text-sm" aria-label={`${stars[i]} stars`}>
              {'⭐'.repeat(stars[i])}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
