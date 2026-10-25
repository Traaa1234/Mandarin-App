import { TONE_COLORS } from '../lib/colors';

// Tone contours in a 100 × 60 box, high pitch at the top. Tone 5 (neutral) is a dot.
export const TONE_PATHS: Record<number, string> = {
  1: 'M 10 14 L 90 14',
  2: 'M 10 50 L 90 10',
  3: 'M 10 24 C 30 58 55 58 90 10',
  4: 'M 10 10 L 90 52',
  5: 'M 50 34 L 50.1 34',
};

export default function ToneShape({
  tone,
  width = 100,
  hand = false,
  run = 0,
}: {
  tone: number;
  width?: number;
  // Show a hand that traces the shape, the hand motion children copy.
  hand?: boolean;
  // Change it to trace the shape again.
  run?: number;
}) {
  const d = TONE_PATHS[tone];
  const color = TONE_COLORS[tone];
  return (
    <svg width={width} height={(width * 60) / 100} viewBox="0 0 100 60" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth={tone === 5 ? 14 : 8} strokeLinecap="round" fill="none" />
      {hand && tone !== 5 && (
        <text key={run} fontSize="22" textAnchor="middle" dominantBaseline="middle">
          ✋
          <animateMotion dur="1.2s" fill="freeze" path={d} />
        </text>
      )}
    </svg>
  );
}
