import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import ToneShape from '../../components/ToneShape';
import { playKey, useSyllables } from '../../lib/audio';
import { keyToMarked } from '../../lib/pinyin';
import { boop, buzz, chime } from '../../lib/sfx';
import { Stars } from './ui';

const ROUNDS = 5;
// Short, clear syllables that exist in all four tones.
const BASES = ['ma', 'ba', 'yi', 'wu', 'yu', 'da', 'tu', 'shi', 'mai', 'tang'];

// Hear a syllable, tap the matching tone shape.
export default function WhichToneGame() {
  const syllables = useSyllables();
  const bases = useMemo(
    () => (syllables ? BASES.filter((b) => [1, 2, 3, 4].every((t) => syllables.has(`${b}${t}`))) : []),
    [syllables],
  );
  const [round, setRound] = useState(0);
  const [stars, setStars] = useState(0);
  const [missed, setMissed] = useState(false);
  const [wobble, setWobble] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);

  const newQuestion = () => {
    const base = bases[Math.floor(Math.random() * bases.length)];
    const key = `${base}${1 + Math.floor(Math.random() * 4)}`;
    setQuestion(key);
    setMissed(false);
    setAnswered(false);
    playKey(key);
  };

  useEffect(() => {
    if (bases.length && !question) newQuestion();
  });

  if (!question) return null;

  if (round >= ROUNDS) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p lang="zh-Hans" className="han text-3xl">
          <span className="block text-base">tài bàng le</span>太棒了！
        </p>
        <Stars count={stars} of={ROUNDS} />
        <button
          type="button"
          onClick={() => {
            setRound(0);
            setStars(0);
            newQuestion();
          }}
          aria-label="Play again"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          🔁
        </button>
      </div>
    );
  }

  const tone = Number(question.slice(-1));

  const choose = (t: number) => {
    if (answered) return;
    if (t === tone) {
      chime();
      buzz();
      setAnswered(true);
      if (!missed) setStars((s) => s + 1);
      setTimeout(() => {
        setRound((r) => r + 1);
        if (round + 1 < ROUNDS) newQuestion();
      }, 1100);
    } else {
      boop();
      setMissed(true);
      setWobble(t);
      setTimeout(() => setWobble(null), 400);
      playKey(question);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-ink/70">
        {round + 1} / {ROUNDS}
      </p>
      <button
        type="button"
        onClick={() => playKey(question)}
        aria-label="Listen again"
        className="flex size-28 items-center justify-center rounded-full bg-white text-6xl shadow-md active:scale-95"
      >
        {answered ? <span className="text-4xl font-bold">{keyToMarked(question)}</span> : '👂'}
      </button>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((t) => (
          <motion.button
            key={t}
            type="button"
            onClick={() => choose(t)}
            animate={wobble === t ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            aria-label={`Tone ${t}`}
            className={`flex h-28 w-36 items-center justify-center rounded-3xl shadow-md active:scale-95 ${
              answered && t === tone ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : 'bg-white'
            }`}
          >
            <ToneShape tone={t} width={110} />
          </motion.button>
        ))}
      </div>
      <Stars count={stars} of={ROUNDS} />
    </div>
  );
}
