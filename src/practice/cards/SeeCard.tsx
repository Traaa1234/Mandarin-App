import { useState } from 'react';
import type { CharData, DataIndex } from '../../data/types';
import { leaves } from '../../lib/ids';
import { playKey } from '../../lib/audio';
import { syllableKey } from '../../lib/syllable';
import type { Outcome } from '../rating';
import ChoiceButton from './ChoiceButton';
import { distractors } from './distractors';
import { shuffle, useChoice } from './useChoice';

// See it. A pictured character: show it, tap its picture (the picture alone,
// without the strokes on it). A compound: show its parts, tap the character.
// A costume: show its root, tap the costume.
export default function SeeCard({
  data,
  index,
  met,
  choices = 3,
  onDone,
}: {
  data: CharData;
  index: DataIndex;
  met: Set<string>;
  // How many answers to show: 2 when things are hard, 4 when they are easy.
  choices?: number;
  onDone: (o: Outcome) => void;
}) {
  const char = data.character;
  const entry = index.chars[char];
  const base = import.meta.env.BASE_URL;
  const pictured = !!entry.picture;
  const [options] = useState(() =>
    shuffle([char, ...distractors(index, char, met, choices - 1, (c) => (pictured ? !!index.chars[c].picture : true))]),
  );
  const { choose, wobble, reveal } = useChoice(char, onDone);
  const say = () => playKey(syllableKey(entry.pinyin));

  const prompt = pictured ? (
    <button type="button" onClick={say} aria-label={`${char}, listen`} lang="zh-Hans" className="han text-9xl leading-none">
      {char}
    </button>
  ) : entry.role === 'costume' ? (
    <span lang="zh-Hans" className="han flex items-center gap-3 text-7xl">
      {data.costumeOf}
      <span className="text-4xl text-ink/70">→</span>
      <span className="text-ink/30">?</span>
    </span>
  ) : (
    <span lang="zh-Hans" className="han flex items-center gap-2 text-6xl">
      {leaves(data.decomposition).map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="px-2 text-4xl text-ink/70">+</span>}
          {p}
        </span>
      ))}
      <span className="px-2 text-4xl text-ink/70">=</span>
      <span className="text-ink/30">?</span>
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex min-h-40 items-center justify-center">{prompt}</div>
      <div className="flex flex-wrap justify-center gap-4">
        {options.map((c) => (
          <ChoiceButton key={c} onPress={() => choose(c)} wobble={wobble === c} highlight={reveal && c === char} label={pictured ? `Picture ${options.indexOf(c) + 1}` : c}>
            {pictured ? (
              <img src={`${base}${index.chars[c].picture}`} alt="" className="size-24 rounded-2xl sm:size-32" />
            ) : (
              <span lang="zh-Hans" className="han text-6xl">{c}</span>
            )}
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
