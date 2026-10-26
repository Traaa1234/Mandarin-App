import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import MnemonicCard from '../components/MnemonicCard';
import { useBoxSize } from '../components/useBoxSize';
import { loadChar } from '../data/load';
import type { CharData, DataIndex } from '../data/types';
import { playKey } from '../lib/audio';
import { syllableKey } from '../lib/syllable';
import { toneClass } from '../lib/tones';
import HearCard from './cards/HearCard';
import SeeCard from './cards/SeeCard';
import ToneCard from './cards/ToneCard';
import WriteCard from './cards/WriteCard';
import { KIND_ICON, type Kind } from './kinds';
import type { Outcome } from './rating';
import type { Step } from './session';
import { store } from './store';

type Phase = { type: 'loading' } | { type: 'intro'; data: CharData } | { type: 'card'; data: CharData; kind: Kind };

// Runs a list of steps: reviews show their card; a new character first hatches
// from a seed and shows its picture card, then its first card. Stops early once
// `deadline` (a performance.now() time) has passed.
export default function CardRunner({
  profileId,
  index,
  steps,
  met,
  deadline,
  onDone,
}: {
  profileId: number;
  index: DataIndex;
  steps: Step[];
  met: Set<string>;
  deadline: number;
  // How many cards were passed (not rated Again).
  onDone: (passed: number) => void;
}) {
  const [at, setAt] = useState(0);
  const [phase, setPhase] = useState<Phase>({ type: 'loading' });
  const [known, setKnown] = useState(met);
  const passed = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (at >= steps.length || performance.now() > deadline) {
      done.current(passed.current);
      return;
    }
    const step = steps[at];
    // Clear the old card first, so it is never re-rendered with the next step's key.
    setPhase({ type: 'loading' });
    loadChar(step.char).then((data) =>
      setPhase(step.type === 'new' ? { type: 'intro', data } : { type: 'card', data, kind: step.kind }),
    );
  }, [steps, at, deadline]);

  const startNew = async (data: CharData) => {
    const kind = await store.startChar(profileId, data.character, index);
    setKnown((m) => new Set(m).add(data.character));
    setPhase({ type: 'card', data, kind });
  };

  const answered = (data: CharData, kind: Kind) => async (o: Outcome) => {
    const rating = await store.answer(profileId, data.character, kind, o, index);
    if (rating > 1) passed.current++;
    setAt((n) => n + 1);
  };

  if (phase.type === 'loading') return null;
  const key = `${at}-${phase.data.character}`;

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap justify-center gap-1.5" aria-label={`Card ${at + 1} of ${steps.length}`}>
        {steps.map((_, i) => (
          <li key={i} className={`h-3 w-6 rounded-full ${i < at ? 'bg-[#f59f00]' : i === at ? 'bg-[#ffd43b]' : 'bg-[#e9dfcc]'}`} />
        ))}
      </ol>
      {phase.type === 'intro' ? (
        <NewChar key={key} data={phase.data} onGo={() => startNew(phase.data)} />
      ) : (
        <>
          <p className="text-center text-3xl" aria-hidden="true">
            {KIND_ICON[phase.kind]}
          </p>
          {phase.kind === 'see' && <SeeCard key={key} data={phase.data} index={index} met={known} onDone={answered(phase.data, 'see')} />}
          {phase.kind === 'hear' && (
            <HearCard key={key} char={phase.data.character} index={index} met={known} onDone={answered(phase.data, 'hear')} />
          )}
          {phase.kind === 'write' && <WriteCard key={key} char={phase.data.character} index={index} onDone={answered(phase.data, 'write')} />}
          {phase.kind === 'tone' && <ToneCard key={key} char={phase.data.character} index={index} onDone={answered(phase.data, 'tone')} />}
        </>
      )}
    </div>
  );
}

// A seed wiggles and hatches into the new character's picture card and sound.
function NewChar({ data, onGo }: { data: CharData; onGo: () => void }) {
  const size = useBoxSize(280);
  const [hatched, setHatched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setHatched(true);
      playKey(syllableKey(data.pinyin));
    }, 1400);
    return () => clearTimeout(t);
  }, [data.pinyin]);

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
    </motion.div>
  );
}
