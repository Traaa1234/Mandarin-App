import { useEffect } from 'react';
import ToneShape from '../../components/ToneShape';
import type { DataIndex } from '../../data/types';
import { playKey } from '../../lib/audio';
import { syllableKey } from '../../lib/syllable';
import { toneOf } from '../../lib/tones';
import type { Outcome } from '../rating';
import ChoiceButton from './ChoiceButton';
import { useChoice } from './useChoice';

// Tone it: see the character, hear it, tap its tone shape.
export default function ToneCard({ char, index, onDone }: { char: string; index: DataIndex; onDone: (o: Outcome) => void }) {
  const pinyin = index.chars[char].pinyin;
  const key = syllableKey(pinyin);
  const { choose, wobble, reveal } = useChoice<number>(toneOf(pinyin), onDone);

  useEffect(() => {
    playKey(key);
  }, [key]);

  return (
    <div className="flex flex-col items-center gap-8">
      <button type="button" onClick={() => playKey(key)} aria-label={`${char}, listen`} className="han text-9xl leading-none">
        {char}
      </button>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((t) => (
          <ChoiceButton key={t} onPress={() => choose(t)} wobble={wobble === t} highlight={reveal && t === toneOf(pinyin)} label={`Tone ${t}`}>
            <ToneShape tone={t} width={110} />
          </ChoiceButton>
        ))}
      </div>
    </div>
  );
}
