import { useMemo, useState } from 'react';
import { Speech } from '../components/Baobao';
import { loadChar } from '../data/load';
import type { CharData } from '../data/types';
import HearCard from '../practice/cards/HearCard';
import SeeCard from '../practice/cards/SeeCard';
import ToneCard from '../practice/cards/ToneCard';
import { shuffle } from '../practice/cards/useChoice';
import { weekId } from '../practice/calendar';
import type { Outcome } from '../practice/rating';
import { store } from '../practice/store';
import type { GameProps } from './types';

const QUESTIONS = 5;
const KINDS = ['hear', 'tone', 'see'] as const;

// The Weekly Dragon Riddle: on Sundays a friendly dragon asks 5 mixed questions
// about learned characters. Solving it earns a big sticker. It is a game, not a
// review, so answers don't change the review schedule.
export default function DragonRiddle({ index, learned, profileId, onDone }: GameProps) {
  const questions = useMemo(() => shuffle(learned).slice(0, QUESTIONS).map((c, i) => ({ char: c, kind: KINDS[i % KINDS.length] })), [learned]);
  const [at, setAt] = useState(-1);
  const [data, setData] = useState<CharData | null>(null);
  const [score, setScore] = useState(0);
  const met = new Set(learned);

  const go = async (n: number) => {
    if (n >= questions.length) {
      await store.give(profileId, `sticker:dragon-${weekId(new Date())}`);
      await store.setMeta(profileId, 'dragon-week', weekId(new Date()));
      onDone(score, questions.length);
      return;
    }
    setData(await loadChar(questions[n].char));
    setAt(n);
  };

  const answered = (o: Outcome) => {
    const points = score + (o.retries === 0 && !o.helped ? 1 : 0);
    setScore(points);
    go(at + 1);
  };

  if (at < 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="text-9xl" aria-hidden="true">
          🐉
        </span>
        <Speech han="猜一猜！" pinyin="cāi yi cāi" english="Riddle time! Five questions from the dragon." />
        <button type="button" onClick={() => go(0)} aria-label="Start" className="flex size-20 items-center justify-center rounded-full bg-[#ffe8a3] text-4xl shadow-md active:scale-95">
          ▶
        </button>
      </div>
    );
  }
  if (!data) return null;
  const q = questions[at];
  const key = `${at}-${q.char}`;
  // "See it" needs something to look at; a plain root without a picture gets a sound question instead.
  const kind = q.kind === 'see' && !(index.chars[q.char].picture || index.chars[q.char].role !== 'root') ? 'hear' : q.kind;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-2xl" aria-label={`Question ${at + 1} of ${questions.length}`}>
        🐉 {at + 1} / {questions.length}
      </p>
      {kind === 'hear' && <HearCard key={key} char={q.char} index={index} met={met} onDone={answered} />}
      {kind === 'tone' && <ToneCard key={key} char={q.char} index={index} onDone={answered} />}
      {kind === 'see' && <SeeCard key={key} data={data} index={index} met={met} onDone={answered} />}
    </div>
  );
}
