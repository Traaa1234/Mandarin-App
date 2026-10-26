import { useEffect, useRef, useState } from 'react';
import MnemonicCard from '../components/MnemonicCard';
import { useBoxSize } from '../components/useBoxSize';
import { loadChar } from '../data/load';
import type { CharData, DataIndex } from '../data/types';
import { useIndex } from '../data/useData';
import { playKey } from '../lib/audio';
import { syllableKey } from '../lib/syllable';
import { toneClass } from '../lib/tones';
import HearCard from './cards/HearCard';
import SeeCard from './cards/SeeCard';
import ToneCard from './cards/ToneCard';
import WriteCard from './cards/WriteCard';
import { KIND_ICON, type Kind } from './kinds';
import { useProfile } from './ProfileContext';
import ProfilePicker from './ProfilePicker';
import type { Outcome } from './rating';
import { buildSession, SESSION_MS, type Step } from './session';
import { store } from './store';

type Phase =
  | { type: 'loading' }
  | { type: 'intro'; data: CharData }
  | { type: 'card'; data: CharData; kind: Kind }
  | { type: 'done'; stars: number }
  | { type: 'free' };

// Today's practice: due reviews, then new characters, capped at 8 minutes.
export default function PracticeScreen({ onHome, onFreePlay }: { onHome: () => void; onFreePlay: () => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [picking, setPicking] = useState(false);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onHome}
          aria-label="Home"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <h1 className="han text-3xl font-bold">
          <span className="block text-base font-normal">liànxí</span>练习
        </h1>
        {current && <span className="ml-auto text-5xl">{current.animal}</span>}
      </header>
      {!current || picking ? (
        <ProfilePicker onDone={() => setPicking(false)} />
      ) : (
        index && <Session key={current.id} profileId={current.id!} index={index} onHome={onHome} onFreePlay={onFreePlay} />
      )}
    </main>
  );
}

function Session({
  profileId,
  index,
  onHome,
  onFreePlay,
}: {
  profileId: number;
  index: DataIndex;
  onHome: () => void;
  onFreePlay: () => void;
}) {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ type: 'loading' });
  const [met, setMet] = useState<Set<string>>(new Set());
  const stars = useRef(0);
  const started = useRef(performance.now());

  useEffect(() => {
    (async () => {
      const cards = await store.cards(profileId);
      setMet(new Set(cards.map((c) => c.char)));
      const plan = buildSession(index, cards.map((c) => ({ char: c.char, kind: c.kind, due: c.card.due })), new Date());
      setSteps(plan);
      if (!plan.length) setPhase({ type: 'free' });
    })();
  }, [profileId, index]);

  // Show the step at `at`, or finish when the steps or the 8 minutes run out.
  useEffect(() => {
    if (!steps?.length) return;
    const elapsed = performance.now() - started.current;
    if (at >= steps.length || elapsed > SESSION_MS) {
      store.addTime(profileId, elapsed);
      setPhase({ type: 'done', stars: stars.current });
      return;
    }
    const step = steps[at];
    // Clear the old card first, so it is never re-rendered with the next step's key.
    setPhase({ type: 'loading' });
    loadChar(step.char).then((data) =>
      setPhase(step.type === 'new' ? { type: 'intro', data } : { type: 'card', data, kind: step.kind }),
    );
  }, [steps, at, profileId]);

  const startNew = async (data: CharData) => {
    const kind = await store.startChar(profileId, data.character, index);
    setMet((m) => new Set(m).add(data.character));
    setPhase({ type: 'card', data, kind });
  };

  const answered = (data: CharData, kind: Kind) => async (o: Outcome) => {
    const rating = await store.answer(profileId, data.character, kind, o, index);
    if (rating > 1) stars.current++;
    setAt((n) => n + 1);
  };

  if (!steps || phase.type === 'loading') return null;

  if (phase.type === 'free') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="text-8xl">🌸</span>
        <p className="text-ink/60">Nothing to review right now.</p>
        <button
          type="button"
          onClick={onFreePlay}
          aria-label="Free play"
          className="flex min-h-16 items-center gap-2 rounded-2xl bg-[#ffe8a3] px-5 text-3xl shadow-md active:scale-95"
        >
          🎮
        </button>
      </div>
    );
  }

  if (phase.type === 'done') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="text-8xl">🎉</span>
        <p className="han text-4xl">
          <span className="block text-base">tài bàng le</span>太棒了！
        </p>
        <p className="text-4xl" aria-label={`${phase.stars} stars`}>
          {'⭐'.repeat(Math.min(phase.stars, 13))}
        </p>
        <button
          type="button"
          onClick={onHome}
          aria-label="Home"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          🏠
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex justify-center gap-1.5" aria-label={`Step ${at + 1} of ${steps.length}`}>
        {steps.map((_, i) => (
          <li key={i} className={`h-3 w-6 rounded-full ${i < at ? 'bg-[#f59f00]' : i === at ? 'bg-[#ffd43b]' : 'bg-[#e9dfcc]'}`} />
        ))}
      </ol>
      {phase.type === 'intro' ? (
        <NewChar data={phase.data} onGo={() => startNew(phase.data)} />
      ) : (
        <>
          <p className="text-center text-3xl" aria-hidden="true">
            {KIND_ICON[phase.kind]}
          </p>
          {phase.kind === 'see' && (
            <SeeCard key={`${at}-${phase.data.character}-see`} data={phase.data} index={index} met={met} onDone={answered(phase.data, 'see')} />
          )}
          {phase.kind === 'hear' && (
            <HearCard key={`${at}-${phase.data.character}-hear`} char={phase.data.character} index={index} met={met} onDone={answered(phase.data, 'hear')} />
          )}
          {phase.kind === 'write' && (
            <WriteCard key={`${at}-${phase.data.character}-write`} char={phase.data.character} index={index} onDone={answered(phase.data, 'write')} />
          )}
          {phase.kind === 'tone' && (
            <ToneCard key={`${at}-${phase.data.character}-tone`} char={phase.data.character} index={index} onDone={answered(phase.data, 'tone')} />
          )}
        </>
      )}
    </div>
  );
}

// Meeting a new character: its picture card (or the character), its sound, then go.
function NewChar({ data, onGo }: { data: CharData; onGo: () => void }) {
  const size = useBoxSize(280);
  useEffect(() => {
    playKey(syllableKey(data.pinyin));
  }, [data.pinyin]);
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-3xl" aria-hidden="true">
        🌱
      </p>
      <MnemonicCard data={data} size={size} />
      <button type="button" onClick={() => playKey(syllableKey(data.pinyin))} className="flex flex-col items-center" aria-label={`${data.character}, listen`}>
        <span className={`text-2xl ${toneClass(data.pinyin)}`}>{data.pinyin}</span>
        <span className="text-ink/60">{data.gloss}</span>
      </button>
      <button
        type="button"
        onClick={onGo}
        aria-label="Go"
        className="flex size-20 items-center justify-center rounded-full bg-[#ffe8a3] text-4xl shadow-md active:scale-95"
      >
        ▶
      </button>
    </div>
  );
}
