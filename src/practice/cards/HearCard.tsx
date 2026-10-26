import { useEffect, useState } from 'react';
import type { DataIndex } from '../../data/types';
import { playKey } from '../../lib/audio';
import { syllableKey } from '../../lib/syllable';
import type { Outcome } from '../rating';
import ChoiceButton from './ChoiceButton';
import { distractors } from './distractors';
import { shuffle, useChoice } from './useChoice';

// Hear it: the sound plays, tap the character.
export default function HearCard({
  char,
  index,
  met,
  choices = 3,
  onDone,
}: {
  char: string;
  index: DataIndex;
  met: Set<string>;
  // How many answers to show: 2 when things are hard, 4 when they are easy.
  choices?: number;
  onDone: (o: Outcome) => void;
}) {
  const key = syllableKey(index.chars[char].pinyin);
  const [options] = useState(() =>
    shuffle([char, ...distractors(index, char, met, choices - 1, (c) => syllableKey(index.chars[c].pinyin) !== key)]),
  );
  const { choose, wobble, reveal } = useChoice(char, onDone);

  useEffect(() => {
    playKey(key);
  }, [key]);

  return (
    <div className="flex flex-col items-center gap-8">
      <button
        type="button"
        onClick={() => playKey(key)}
        aria-label="Listen again"
        className="flex size-32 items-center justify-center rounded-full bg-white text-7xl shadow-md active:scale-95"
      >
        👂
      </button>
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((c) => (
          <ChoiceButton key={c} onPress={() => choose(c)} wobble={wobble === c} highlight={reveal && c === char} label={c}>
            <span lang="zh-Hans" className="han text-6xl">{c}</span>
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
