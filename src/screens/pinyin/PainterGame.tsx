import { useEffect, useRef, useState } from 'react';
import ToneShape, { TONE_PATHS } from '../../components/ToneShape';
import { playKey } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { keyToMarked } from '../../lib/pinyin';
import { buzz, chime } from '../../lib/sfx';
import { content } from './content';

const SAMPLES = 24;
// How close (in the 100 × 60 box) a finger must pass to a point of the shape.
const REACH = 8;
const NEEDED = 0.85;

type Point = { x: number; y: number };

// Trace the tone shape with a finger while the sound plays.
export default function PainterGame() {
  const [tone, setTone] = useState(1);
  const [trail, setTrail] = useState<Point[]>([]);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const guideRef = useRef<SVGPathElement>(null);
  const samples = useRef<Point[]>([]);
  const drawing = useRef(false);

  const key = `${content.toneExample}${tone}`;

  useEffect(() => {
    const path = guideRef.current!;
    const len = path.getTotalLength();
    samples.current = Array.from({ length: SAMPLES }, (_, i) => {
      const p = path.getPointAtLength((len * i) / (SAMPLES - 1));
      return { x: p.x, y: p.y };
    });
    setTrail([]);
    setDone(false);
  }, [tone]);

  const toBox = (e: React.PointerEvent): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 60 };
  };

  const covered = (points: Point[]) => {
    const near = samples.current.filter((s) => points.some((p) => Math.hypot(p.x - s.x, p.y - s.y) < REACH));
    return near.length / SAMPLES;
  };

  const onDown = (e: React.PointerEvent) => {
    if (done) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    setTrail([toBox(e)]);
    playKey(key);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || done) return;
    setTrail((t) => [...t, toBox(e)]);
  };

  const onUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    // The trace must start near the beginning of the shape and cover most of it.
    const start = samples.current[0];
    const startsRight = trail.length > 0 && Math.hypot(trail[0].x - start.x, trail[0].y - start.y) < REACH * 2;
    if (startsRight && covered(trail) >= NEEDED) {
      setDone(true);
      chime();
      buzz();
      playKey(key);
    } else {
      setTrail([]);
      setRun((r) => r + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTone(t)}
            aria-label={`Tone ${t}`}
            aria-pressed={t === tone}
            className={`flex size-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md active:scale-95 ${
              t === tone ? 'ring-4 ring-[#f59f00]' : 'opacity-60'
            }`}
            style={{ background: TONE_COLORS[t] }}
          >
            {t}
          </button>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 60"
        className="w-full max-w-md touch-none rounded-3xl bg-white shadow-md"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label={`Trace tone ${tone}`}
      >
        <path ref={guideRef} d={TONE_PATHS[tone]} stroke={TONE_COLORS[tone]} strokeOpacity={0.2} strokeWidth={14} strokeLinecap="round" fill="none" />
        <circle cx={samples.current[0]?.x} cy={samples.current[0]?.y} r={4} fill={TONE_COLORS[tone]} opacity={done ? 0 : 0.8} />
        {trail.length > 1 && (
          <polyline
            points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
            stroke={TONE_COLORS[tone]}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>

      <div className="flex min-h-20 items-center gap-4" aria-live="polite">
        {done ? (
          <>
            <span className="text-6xl font-bold" style={{ color: TONE_COLORS[tone] }}>
              {keyToMarked(key)}
            </span>
            <span className="text-5xl">⭐</span>
            {tone < 4 && (
              <button
                type="button"
                onClick={() => setTone(tone + 1)}
                aria-label="Next tone"
                className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
              >
                ▶
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setRun((r) => r + 1);
              playKey(key);
            }}
            aria-label="Show me"
            className="flex min-h-16 items-center rounded-2xl bg-white px-3 shadow-md active:scale-95"
          >
            <ToneShape tone={tone} width={90} hand run={run} />
          </button>
        )}
      </div>
    </div>
  );
}
