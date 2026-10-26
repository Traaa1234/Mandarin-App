import { useEffect } from 'react';
import Baobao, { Speech } from '../components/Baobao';
import SpeakButton from '../components/SpeakButton';
import { useIndex } from '../data/useData';
import { playKey } from '../lib/audio';
import { syllableKey } from '../lib/syllable';
import { toneClass } from '../lib/tones';
import { activeFestival } from './festivals';
import { useProfile } from './ProfileContext';
import ScreenFrame from './ScreenFrame';
import { store } from './store';

// A seasonal event: its characters to explore, and a festival sticker for visiting.
export default function FestivalScreen({ onHome, onChar }: { onHome: () => void; onChar: (c: string) => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const festival = activeFestival(new Date());

  useEffect(() => {
    if (current && festival) store.give(current.id!, `sticker:festival-${festival.id}-${new Date().getFullYear()}`);
  }, [current, festival]);

  if (!festival || !index) return null;
  return (
    <ScreenFrame han={festival.han} pinyin={festival.pinyin} onBack={onHome}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Baobao mood="cheer" size={120} />
          <span className="text-7xl" aria-hidden="true">
            {festival.icon}
          </span>
        </div>
        <Speech han={festival.han} pinyin={festival.pinyin} english={festival.name} />
        <ul className="grid grid-cols-3 gap-3">
          {festival.chars.map((c) => {
            const entry = index.chars[c];
            return (
              <li key={c} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    playKey(syllableKey(entry.pinyin));
                    onChar(c);
                  }}
                  aria-label={`${c}, ${entry.gloss}`}
                  className="flex w-full flex-col items-center rounded-3xl bg-[#ffe3e3] p-3 shadow-md active:scale-95"
                >
                  <span className={`py text-lg ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
                  <span className="han text-6xl text-[#c92a2a]">{c}</span>
                  <span className="en text-xs text-ink/50">{entry.gloss}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <SpeakButton text={festival.han} />
      </div>
    </ScreenFrame>
  );
}
