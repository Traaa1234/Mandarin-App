import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { DataIndex } from '../../data/types';
import { playFile } from '../../lib/audio';
import { toneClass } from '../../lib/tones';
import type { Outcome } from '../rating';
import ChoiceButton from './ChoiceButton';
import { shuffle, useChoice } from './useChoice';

const play = (index: DataIndex, word: string) => playFile(index.words[word].audio);

// Other words to choose from, preferring ones the child has met, never one
// with the same picture.
function otherWords(index: DataIndex, word: string, met: Set<string>, count: number): string[] {
  const pool = Object.keys(index.words).filter((w) => w !== word && index.words[w].icon !== index.words[word].icon);
  return [...shuffle(pool.filter((w) => met.has(w))), ...shuffle(pool.filter((w) => !met.has(w)))].slice(0, count);
}

// The word's characters, each with its pinyin above it in its tone color.
export function WordRuby({ index, word, size = 'text-6xl' }: { index: DataIndex; word: string; size?: string }) {
  return (
    <span lang="zh-Hans" className={`han flex items-end justify-center ${size}`}>
      {Array.from(word).map((c, i) => (
        <ruby key={i} className="px-0.5">
          {c}
          <rt className={`py pb-1 font-sans text-lg ${toneClass(index.chars[c]?.pinyin ?? '')}`}>{index.chars[c]?.pinyin}</rt>
        </ruby>
      ))}
    </span>
  );
}

// A seed hatches into a new word: its picture, its characters and its sound.
export function NewWord({ index, word, onGo }: { index: DataIndex; word: string; onGo: () => void }) {
  const [hatched, setHatched] = useState(false);
  const entry = index.words[word];

  useEffect(() => {
    const t = setTimeout(() => {
      setHatched(true);
      play(index, word);
    }, 1400);
    return () => clearTimeout(t);
  }, [index, word]);

  if (!hatched) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center">
        <motion.span
          className="text-8xl"
          animate={{ rotate: [0, -12, 12, -12, 12, 0], scale: [1, 1, 1, 1, 1.3, 0.2] }}
          transition={{ duration: 1.4 }}
          aria-label="A seed"
        >
          🌰
        </motion.span>
      </div>
    );
  }

  return (
    <motion.div className="flex flex-col items-center gap-4" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <span className="text-9xl" aria-hidden="true">
        {entry.icon}
      </span>
      <button type="button" onClick={() => play(index, word)} className="flex flex-col items-center rounded-3xl bg-white px-6 py-3 shadow-md active:scale-95" aria-label={`${word}, listen`}>
        <WordRuby index={index} word={word} size="text-7xl" />
        <span className="en text-ink/70">{entry.gloss}</span>
      </button>
      <button
        type="button"
        onClick={onGo}
        aria-label="Go"
        className="flex size-20 items-center justify-center rounded-full bg-[#ffe8a3] text-4xl shadow-md active:scale-95"
      >
        ▶
      </button>
    </motion.div>
  );
}

// See it: read the word, tap its picture.
export function WordSeeCard({
  index,
  word,
  met,
  choices = 3,
  onDone,
}: {
  index: DataIndex;
  word: string;
  met: Set<string>;
  choices?: number;
  onDone: (o: Outcome) => void;
}) {
  const [options] = useState(() => shuffle([word, ...otherWords(index, word, met, choices - 1)]));
  const { choose, wobble, reveal, finished } = useChoice(word, onDone);

  useEffect(() => {
    if (finished) play(index, word);
  }, [finished, index, word]);

  return (
    <div className="flex flex-col items-center gap-8">
      <span lang="zh-Hans" className="han rounded-3xl bg-white px-6 py-2 text-7xl shadow-md">
        {word}
      </span>
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((w) => (
          <ChoiceButton key={w} onPress={() => choose(w)} wobble={wobble === w} highlight={reveal && w === word} label={index.words[w].gloss}>
            <span className="text-6xl">{index.words[w].icon}</span>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}

// Hear it: the word plays, tap the word.
export function WordHearCard({
  index,
  word,
  met,
  choices = 3,
  onDone,
}: {
  index: DataIndex;
  word: string;
  met: Set<string>;
  choices?: number;
  onDone: (o: Outcome) => void;
}) {
  const [options] = useState(() => shuffle([word, ...otherWords(index, word, met, choices - 1)]));
  const { choose, wobble, reveal } = useChoice(word, onDone);

  useEffect(() => {
    play(index, word);
  }, [index, word]);

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => play(index, word)}
        aria-label="Listen again"
        className="flex size-32 items-center justify-center rounded-full bg-white text-7xl shadow-md active:scale-95"
      >
        👂
      </button>
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((w) => (
          <ChoiceButton key={w} onPress={() => choose(w)} wobble={wobble === w} highlight={reveal && w === word} label={w}>
            <span lang="zh-Hans" className="han text-5xl">{w}</span>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
