import { useEffect, useState } from 'react';
import ToneShape from '../../components/ToneShape';
import type { DataIndex } from '../../data/types';
import { playKey } from '../../lib/audio';
import { syllableKey } from '../../lib/syllable';
import { toneOf } from '../../lib/tones';
import type { Outcome } from '../rating';
import ChoiceButton from './ChoiceButton';
import { shuffle, useChoice } from './useChoice';

// Tone it: see the character, hear it, tap its tone shape.
export default function ToneCard({ char, index, few = false, onDone }: { char: string; index: DataIndex; few?: boolean; onDone: (o: Outcome) => void }) {
  const pinyin = index.chars[char].pinyin;
  // The easier version: just the right tone and one other.
  const [tones] = useState(() => (few ? shuffle([toneOf(pinyin), shuffle([1, 2, 3, 4].filter((t) => t !== toneOf(pinyin)))[0]]) : [1, 2, 3, 4]));
  const key = syllableKey(pinyin);
  const { choose, wobble, reveal } = useChoice<number>(toneOf(pinyin), onDone);

  useEffect(() => {
    playKey(key);
  }, [key]);

  return (
    <div className="flex flex-col items-center gap-8">
      <button type="button" onClick={() => playKey(key)} aria-label={`${char}, listen`} lang="zh-Hans" className="han text-9xl leading-none">
        {char}
      </button>
      <div className="grid grid-cols-2 gap-4">
        {tones.map((t) => (
          <ChoiceButton key={t} onPress={() => choose(t)} wobble={wobble === t} highlight={reveal && t === toneOf(pinyin)} label={`Tone ${t}`}>
            <ToneShape tone={t} width={110} />
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
