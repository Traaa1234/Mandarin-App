import { motion, type PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { loadChar } from '../data/load';
import { leaves } from '../lib/ids';
import { playKey } from '../lib/audio';
import { boop, buzz, chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { toneClass } from '../lib/tones';
import { store } from '../practice/store';
import type { GameProps } from './types';

const GOAL = 3;
const sameParts = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

// Mixing Bowl (Build-a-Character): drag learned roots into the bowl. If they
// make a real character it is cooked, spoken, and planted in the garden; if not,
// Bǎobao gently says they don't make one yet and hints at a pair that does.
export default function MixingBowl({ index, learned, profileId, onDone }: GameProps) {
  const known = new Set(learned);
  // Every compound's parts, repeats included (森 = 木 + 木 + 木).
  const [partsOf, setPartsOf] = useState<Record<string, string[]>>({});
  const bowlRef = useRef<HTMLDivElement>(null);
  const [bowl, setBowl] = useState<string[]>([]);
  const [made, setMade] = useState<string[]>([]);
  const [message, setMessage] = useState<{ made?: string; planted?: boolean; hint?: string } | null>(null);

  useEffect(() => {
    const compounds = Object.keys(index.chars).filter((c) => index.chars[c].role === 'compound');
    Promise.all(compounds.map(loadChar)).then((all) =>
      setPartsOf(Object.fromEntries(all.map((d) => [d.character, leaves(d.decomposition)]))),
    );
  }, [index]);

  // The recipes that can be found: compounds whose every part is learned.
  const possible = Object.entries(partsOf).filter(([, parts]) => parts.every((p) => known.has(p)));
  const ingredients = useMemo(() => {
    const needed = [...new Set(possible.flatMap(([, parts]) => parts))];
    const others = learned.filter((c) => index.chars[c].role !== 'compound' && !needed.includes(c));
    return [...needed, ...others].slice(0, 8);
  }, [partsOf, learned]);

  const finish = (count: number) => setTimeout(() => onDone(count, Math.min(GOAL, possible.length) || 1), 1600);

  const add = async (c: string) => {
    if (message?.made || bowl.length >= 3) return;
    buzz(10);
    const next = [...bowl, c];
    setBowl(next);
    setMessage(null);
    if (next.length < 2) return;
    const hit = possible.find(([, parts]) => sameParts(parts, next));
    if (hit) {
      const [char] = hit;
      chime();
      playKey(syllableKey(index.chars[char].pinyin));
      const started = new Set((await store.cards(profileId)).map((r) => r.char));
      if (!started.has(char)) await store.startChar(profileId, char, index);
      const total = [...new Set([...made, char])];
      setMade(total);
      setMessage({ made: char, planted: !started.has(char) });
      setTimeout(() => {
        setBowl([]);
        setMessage(null);
      }, 1800);
      if (total.length >= Math.min(GOAL, possible.length)) finish(total.length);
      return;
    }
    // Could a third part still make something?
    const waiting = next.length === 2 && possible.some(([, parts]) => parts.length === 3 && next.every((p) => parts.includes(p)));
    if (waiting) return;
    boop();
    const hint = possible.find(([char]) => !made.includes(char));
    setMessage({ hint: hint?.[1].join(' + ') });
    setTimeout(() => setBowl([]), 1500);
  };

  const dropped = (c: string) => (_: unknown, info: PanInfo) => {
    const r = bowlRef.current?.getBoundingClientRect();
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    if (r && x > r.left && x < r.right && y > r.top && y < r.bottom) add(c);
  };

  if (!Object.keys(partsOf).length) return null;
  if (!possible.length) {
    return <p className="text-center text-ink/60">Learn a few more roots to start cooking! 🥣</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={bowlRef} className="relative flex h-40 w-64 items-center justify-center rounded-b-full bg-[#ffe3c2] shadow-inner" aria-label={`Bowl: ${bowl.join(' ') || 'empty'}`}>
        {message?.made ? (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1.2 }} className="han text-7xl">
            {message.made}
          </motion.span>
        ) : (
          <span className="han text-5xl">{bowl.join(' + ')}</span>
        )}
        <span className="absolute -bottom-2 text-5xl" aria-hidden="true">
          🥣
        </span>
      </div>
      <div className="min-h-12 text-center" aria-live="polite">
        {message?.made && (
          <p className="text-lg">
            <span className={'py ' + toneClass(index.chars[message.made].pinyin)}>{index.chars[message.made].pinyin}</span> {index.chars[message.made].gloss}
            {message.planted && ' · 🌱'}
          </p>
        )}
        {message?.hint && (
          <p className="text-lg">
            🤔 Not a character yet. Try <span className="han font-bold">{message.hint}</span>
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {ingredients.map((c) => (
          <motion.button
            key={c}
            type="button"
            drag
            dragSnapToOrigin
            whileDrag={{ scale: 1.15, zIndex: 20 }}
            onTap={() => add(c)}
            onDragEnd={dropped(c)}
            aria-label={c}
            className="han flex size-16 touch-none items-center justify-center rounded-2xl bg-white text-4xl shadow-md"
          >
            {c}
          </motion.button>
        ))}
      </div>
      <p className="text-2xl" aria-label={`${made.length} cooked`}>
        {made.map((c) => (
          <span key={c} className="han">
            {c}{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
