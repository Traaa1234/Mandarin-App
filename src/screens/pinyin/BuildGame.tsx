import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { useRef, useState } from 'react';
import ToneShape from '../../components/ToneShape';
import { playKey, useSyllables } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { buildKey, keyToMarked } from '../../lib/pinyin';
import { boop, buzz, chime } from '../../lib/sfx';

type Kind = 'initial' | 'final' | 'tone';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];
const FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong'];
const TONES = ['1', '2', '3', '4'];

const KIND_LABEL: Record<Kind, string> = { initial: 'initial', final: 'final', tone: 'tone' };

// Load an initial, a final and a tone onto the train cars, then hear the syllable.
// Pieces can be dragged onto their car or simply tapped.
export default function BuildGame() {
  const syllables = useSyllables();
  const [cars, setCars] = useState<Record<Kind, string | null>>({ initial: null, final: null, tone: null });
  const [result, setResult] = useState<{ key: string; ok: boolean; hint?: string } | null>(null);
  const carRefs = { initial: useRef<HTMLDivElement>(null), final: useRef<HTMLDivElement>(null), tone: useRef<HTMLDivElement>(null) };
  const train = useAnimation();

  const check = (next: Record<Kind, string | null>, force = false) => {
    if (!syllables || !next.final || !next.tone) return;
    if (!next.initial && !force) return;
    const tone = Number(next.tone);
    const key = buildKey(next.initial ?? '', next.final, tone);
    if (syllables.has(key)) {
      setResult({ key, ok: true });
      chime();
      buzz();
      playKey(key);
      train.start({ x: [0, 24, 0], transition: { duration: 0.6 } });
    } else {
      // Gently point to a final that does work with this initial and tone.
      const works = FINALS.find((f) => syllables.has(buildKey(next.initial ?? '', f, tone)));
      setResult({ key, ok: false, hint: works && buildKey(next.initial ?? '', works, tone) });
      boop();
    }
  };

  const place = (kind: Kind, value: string) => {
    const next = { ...cars, [kind]: value };
    setCars(next);
    setResult(null);
    check(next);
  };

  const onDragEnd = (kind: Kind, value: string) => (_: unknown, info: PanInfo) => {
    const rect = carRefs[kind].current?.getBoundingClientRect();
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    if (rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) place(kind, value);
  };

  const piece = (kind: Kind, value: string) => (
    <motion.button
      key={value}
      type="button"
      drag
      dragSnapToOrigin
      dragElastic={0.6}
      whileDrag={{ scale: 1.15, zIndex: 30 }}
      onTap={() => place(kind, value)}
      onDragEnd={onDragEnd(kind, value)}
      aria-label={kind === 'tone' ? `Tone ${value}` : value}
      className="flex min-h-14 min-w-14 touch-none items-center justify-center rounded-2xl bg-white px-2 text-2xl font-semibold shadow-md"
    >
      {kind === 'tone' ? <ToneShape tone={Number(value)} width={44} /> : value}
    </motion.button>
  );

  return (
    <div className="flex flex-col gap-5">
      <motion.div animate={train} className="flex items-end justify-center gap-2" aria-label="Train">
        <span className="text-5xl" aria-hidden="true">
          🚂
        </span>
        {(['initial', 'final', 'tone'] as Kind[]).map((kind) => (
          <div role="group"
            key={kind}
            ref={carRefs[kind]}
            aria-label={`${KIND_LABEL[kind]} car: ${cars[kind] ?? 'empty'}`}
            className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-4 border-dashed border-[#d9c7a3] bg-[#fff9db] text-3xl font-semibold sm:w-24"
          >
            {kind === 'tone' && cars.tone ? <ToneShape tone={Number(cars.tone)} width={56} /> : cars[kind] ?? ''}
          </div>
        ))}
      </motion.div>

      <div className="flex min-h-24 flex-col items-center justify-center gap-2" aria-live="polite">
        {result?.ok && (
          <button
            type="button"
            onClick={() => playKey(result.key)}
            className="text-6xl font-bold"
            style={{ color: TONE_COLORS[Number(result.key.slice(-1))] }}
          >
            {keyToMarked(result.key)} 🔊
          </button>
        )}
        {result && !result.ok && (
          <p className="text-center text-lg">
            🤔 Not a sound yet.
            {result.hint && (
              <>
                {' '}
                Try <span className="font-bold">{keyToMarked(result.hint)}</span>
              </>
            )}
          </p>
        )}
        {!result && cars.final && cars.tone && !cars.initial && (
          <button
            type="button"
            onClick={() => check(cars, true)}
            aria-label="Go without an initial"
            className="flex min-h-14 items-center rounded-2xl bg-[#ffe8a3] px-4 text-2xl shadow-md active:scale-95"
          >
            🚂 ▶
          </button>
        )}
      </div>

      <section aria-label="Initials" className="flex flex-wrap justify-center gap-2">
        {INITIALS.map((v) => piece('initial', v))}
      </section>
      <section aria-label="Finals" className="flex flex-wrap justify-center gap-2">
        {FINALS.map((v) => piece('final', v))}
      </section>
      <section aria-label="Tones" className="flex flex-wrap justify-center gap-2">
        {TONES.map((v) => piece('tone', v))}
      </section>
    </div>
  );
}
