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
import { NewWord, WordHearCard, WordSeeCard } from './cards/WordCards';
import WriteCard from './cards/WriteCard';
import { isWord } from './items';
import { KIND_ICON, type Kind } from './kinds';
import type { Outcome } from './rating';
import { adapt, CHOICES, START, type AdaptState } from './adaptive';
import type { Step } from './session';
import { leniencyFor, useSettings } from './settings';
import { store } from './store';

type Phase =
  | { type: 'loading' }
  | { type: 'intro'; data: CharData }
  | { type: 'card'; data: CharData; kind: Kind }
  | { type: 'word-intro'; word: string }
  | { type: 'word-card'; word: string; kind: Kind };

// Runs a list of steps: reviews show their card; a new character first hatches
// from a seed and shows its picture card, then its first card. Words work the
// same way with their own cards. Stops early once
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
  const { settings } = useSettings();
  const [level, setLevel] = useState<AdaptState>(START);
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
    if (isWord(step.char)) {
      setPhase(step.type === 'new' ? { type: 'word-intro', word: step.char } : { type: 'word-card', word: step.char, kind: step.kind });
      return;
    }
    loadChar(step.char).then((data) =>
      setPhase(step.type === 'new' ? { type: 'intro', data } : { type: 'card', data, kind: step.kind }),
    );
  }, [steps, at, deadline]);

  const startNew = async (data: CharData) => {
    const kind = await store.startChar(profileId, data.character, index);
    setKnown((m) => new Set(m).add(data.character));
    setPhase({ type: 'card', data, kind });
  };

  const startWord = async (word: string) => {
    const kind = await store.startChar(profileId, word, index);
    setKnown((m) => new Set(m).add(word));
    setPhase({ type: 'word-card', word, kind });
  };

  const answered = (item: string, kind: Kind) => async (o: Outcome) => {
    setLevel((s) => adapt(s, o));
    const rating = await store.answer(profileId, item, kind, o, index);
    if (rating > 1) passed.current++;
    setAt((n) => n + 1);
  };

  if (phase.type === 'loading') return null;
  const key = `${at}-${'data' in phase ? phase.data.character : phase.word}`;

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-wrap justify-center gap-1.5" aria-label={`Card ${at + 1} of ${steps.length}`}>
        {steps.map((_, i) => (
          <li key={i} className={`h-3 w-6 rounded-full ${i < at ? 'bg-[#f59f00]' : i === at ? 'bg-[#ffd43b]' : 'bg-[#e9dfcc]'}`} />
        ))}
      </ol>
      {phase.type === 'intro' ? (
        <NewChar key={key} data={phase.data} onGo={() => startNew(phase.data)} />
      ) : phase.type === 'word-intro' ? (
        <NewWord key={key} index={index} word={phase.word} onGo={() => startWord(phase.word)} />
      ) : phase.type === 'word-card' ? (
        <>
          <p className="text-center text-3xl" aria-hidden="true">
            {KIND_ICON[phase.kind]}
          </p>
          {phase.kind === 'see' ? (
            <WordSeeCard key={key} index={index} word={phase.word} met={known} choices={CHOICES[level.level]} onDone={answered(phase.word, 'see')} />
          ) : (
            <WordHearCard key={key} index={index} word={phase.word} met={known} choices={CHOICES[level.level]} onDone={answered(phase.word, 'hear')} />
          )}
        </>
      ) : (
        <>
          <p className="text-center text-3xl" aria-hidden="true">
            {KIND_ICON[phase.kind]}
          </p>
          {phase.kind === 'see' && (
            <SeeCard key={key} data={phase.data} index={index} met={known} choices={CHOICES[level.level]} onDone={answered(phase.data.character, 'see')} />
          )}
          {phase.kind === 'hear' && (
            <HearCard key={key} char={phase.data.character} index={index} met={known} choices={CHOICES[level.level]} onDone={answered(phase.data.character, 'hear')} />
          )}
          {phase.kind === 'write' && (
            <WriteCard
              key={key}
              char={phase.data.character}
              index={index}
              leniency={leniencyFor(settings) + (level.level === 'easier' ? 0.5 : 0)}
              outline={level.level !== 'harder'}
              onDone={answered(phase.data.character, 'write')}
            />
          )}
          {phase.kind === 'tone' && (
            <ToneCard key={key} char={phase.data.character} index={index} few={level.level === 'easier'} onDone={answered(phase.data.character, 'tone')} />
          )}
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
        <span className={`text-2xl py ${toneClass(data.pinyin)}`}>{data.pinyin}</span>
        <span className="en text-ink/70">{data.gloss}</span>
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
