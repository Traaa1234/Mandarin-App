import { useEffect, useMemo, useState } from 'react';
import Baobao, { Speech } from '../components/Baobao';
import { useIndex } from '../data/useData';
import { playKey } from '../lib/audio';
import { chime } from '../lib/sfx';
import { syllableKey } from '../lib/syllable';
import { toneClass } from '../lib/tones';
import { weekId } from './calendar';
import { shuffle } from './cards/useChoice';
import { useProfile } from './ProfileContext';
import ScreenFrame from './ScreenFrame';
import { store } from './store';

const ROUNDS = 5;

// Teach Mom or Dad: the roles flip and the child quizzes a parent with
// characters they know. The child can peek at the answer and hear it.
export default function TeachScreen({ onHome }: { onHome: () => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [learned, setLearned] = useState<string[] | null>(null);
  const [at, setAt] = useState(0);
  const [peek, setPeek] = useState(false);
  const [right, setRight] = useState(0);

  useEffect(() => {
    if (current) store.learned(current.id!).then((s) => setLearned([...s]));
  }, [current]);
  // Characters only: words are practised in the adventure.
  const questions = useMemo(() => (learned && index ? shuffle(learned.filter((c) => index.chars[c])).slice(0, ROUNDS) : []), [learned, index]);

  useEffect(() => {
    if (current && learned && at >= questions.length && questions.length) store.log(current.id!, 'teach', { week: weekId(new Date()), right });
  }, [at]);

  if (!index || !learned) return null;
  const base = import.meta.env.BASE_URL;
  const char = questions[at];

  return (
    <ScreenFrame han="教爸爸妈妈" pinyin="jiāo bàba māma" onBack={onHome}>
      {!char ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <Baobao mood="cheer" size={140} />
          <Speech han="你是好老师！" pinyin="nǐ shì hǎo lǎoshī" english="You're a great teacher!" />
          <p className="text-4xl" aria-label={`${right} answered right`}>
            {'⭐'.repeat(right)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <p className="en text-center text-ink/70">Show this to Mom or Dad. What is it?</p>
          <span lang="zh-Hans" className="han text-9xl leading-none">{char}</span>
          {peek ? (
            <div className="flex flex-col items-center gap-2">
              {index.chars[char].picture && <img src={`${base}${index.chars[char].picture}`} alt="" className="size-28 rounded-2xl" />}
              <span className={`text-3xl ${toneClass(index.chars[char].pinyin)}`}>{index.chars[char].pinyin}</span>
              <span className="text-lg text-ink/70">{index.chars[char].gloss}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPeek(true);
                playKey(syllableKey(index.chars[char].pinyin));
              }}
              aria-label="Peek at the answer"
              className="flex size-20 items-center justify-center rounded-full bg-white text-4xl shadow-md active:scale-95"
            >
              👀
            </button>
          )}
          <div className="flex gap-4">
            {[
              { label: 'They got it', icon: '👍', ok: true },
              { label: 'Not yet', icon: '🤔', ok: false },
            ].map((b) => (
              <button
                key={b.icon}
                type="button"
                onClick={() => {
                  if (b.ok) {
                    chime();
                    setRight((r) => r + 1);
                  }
                  setPeek(false);
                  setAt((n) => n + 1);
                }}
                aria-label={b.label}
                className="flex size-20 items-center justify-center rounded-3xl bg-white text-5xl shadow-md active:scale-95"
              >
                {b.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
