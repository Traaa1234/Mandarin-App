import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Baobao, { Speech, type Mood } from '../components/Baobao';
import Flower from '../components/Flower';
import type { DataIndex, Phrase } from '../data/types';
import { useIndex } from '../data/useData';
import { allPhrases, usePhrases } from '../data/usePhrases';
import CharacterCatch from '../games/CharacterCatch';
import { playFile } from '../lib/audio';
import { chime } from '../lib/sfx';
import { RecordAndCompare } from '../screens/speak/PhraseScreen';
import CardRunner from './CardRunner';
import { useProfile } from './ProfileContext';
import ProfilePicker from './ProfilePicker';
import { buildSession, SESSION_MS, type Step } from './session';
import { store } from './store';

// The daily adventure always has the same five parts, so it becomes a habit.
const PARTS = [
  { id: 'warmup', icon: '💧', label: 'Water the flowers' },
  { id: 'discover', icon: '🌰', label: 'Find a seed' },
  { id: 'play', icon: '🎈', label: 'Play' },
  { id: 'speak', icon: '🗣️', label: 'Say it to Bǎobao' },
  { id: 'reward', icon: '🎁', label: 'Gift' },
] as const;
type PartId = (typeof PARTS)[number]['id'];

const line = (phrases: Phrase[], id: string) => phrases.find((p) => p.id === id)!;

export default function AdventureScreen({ onHome }: { onHome: () => void }) {
  const index = useIndex();
  const phrases = usePhrases();
  const { current } = useProfile();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onHome}
          aria-label="Home"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <h1 className="han text-3xl font-bold">
          <span className="block text-base font-normal">jīntiān</span>今天
        </h1>
        {current && <span className="ml-auto text-5xl">{current.animal}</span>}
      </header>
      {!current ? (
        <ProfilePicker onDone={() => {}} />
      ) : (
        index &&
        phrases && <Adventure key={current.id} profileId={current.id!} index={index} phrases={allPhrases(phrases)} onHome={onHome} />
      )}
    </main>
  );
}

function Adventure({ profileId, index, phrases, onHome }: { profileId: number; index: DataIndex; phrases: Phrase[]; onHome: () => void }) {
  const [plan, setPlan] = useState<{ reviews: Step[]; fresh: Step[]; met: Set<string> } | null>(null);
  const [part, setPart] = useState<PartId>('warmup');
  const [ready, setReady] = useState(false);
  const [garden, setGarden] = useState<string[]>([]);
  const passed = useRef(0);
  const started = useRef(performance.now());
  const deadline = started.current + SESSION_MS;

  useEffect(() => {
    (async () => {
      const cards = await store.cards(profileId);
      const steps = buildSession(index, cards.map((c) => ({ char: c.char, kind: c.kind, due: c.card.due })), new Date());
      setPlan({ reviews: steps.filter((s) => s.type === 'review'), fresh: steps.filter((s) => s.type === 'new'), met: new Set(cards.map((c) => c.char)) });
    })();
  }, [profileId, index]);

  // Each part opens with Bǎobao; empty parts are skipped.
  useEffect(() => {
    if (!plan) return;
    if ((part === 'warmup' && !plan.reviews.length) || (part === 'discover' && !plan.fresh.length)) next();
    else setReady(false);
    // Moves on only when the part changes.
  }, [plan, part]);

  useEffect(() => {
    if (part === 'play' || part === 'reward') store.garden(profileId).then((g) => setGarden(g.map((f) => f.char)));
  }, [part, profileId]);

  const next = () => setPart((p) => PARTS[Math.min(PARTS.length - 1, PARTS.findIndex((x) => x.id === p) + 1)].id);
  const finishCards = (n: number) => {
    passed.current += n;
    next();
  };

  if (!plan) return null;
  const at = PARTS.findIndex((p) => p.id === part);

  // One phrase a day, in turn.
  const everyday = phrases.filter((p) => !['great', 'keep-going', 'see-you-tomorrow'].includes(p.id));
  const today = everyday[Math.floor(Date.now() / 86400000) % everyday.length];

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex justify-center gap-2" aria-label={`Part ${at + 1} of ${PARTS.length}: ${PARTS[at].label}`}>
        {PARTS.map((p, i) => (
          <li
            key={p.id}
            className={`flex size-12 items-center justify-center rounded-full text-2xl ${
              i < at ? 'bg-[#ffe8a3]' : i === at ? 'bg-[#f59f00] ring-4 ring-[#ffd43b]' : 'bg-white opacity-50'
            }`}
            aria-hidden="true"
          >
            {p.icon}
          </li>
        ))}
      </ol>

      {!ready && part !== 'reward' ? (
        <Intro part={part} phrases={phrases} count={part === 'warmup' ? plan.reviews.length : plan.fresh.length} onGo={() => setReady(true)} />
      ) : part === 'warmup' ? (
        <CardRunner key="warmup" profileId={profileId} index={index} steps={plan.reviews} met={plan.met} deadline={deadline} onDone={finishCards} />
      ) : part === 'discover' ? (
        // Its own key: a reused runner would keep the warm-up's finished position.
        <CardRunner key="discover" profileId={profileId} index={index} steps={plan.fresh} met={plan.met} deadline={deadline} onDone={finishCards} />
      ) : part === 'play' ? (
        garden.length >= 3 ? (
          <CharacterCatch chars={garden} index={index} onDone={next} />
        ) : (
          <SkipPlay onNext={next} />
        )
      ) : part === 'speak' ? (
        <div className="flex flex-col items-center gap-4">
          <SpeakToday phrase={today} />
          <RecordAndCompare phrase={today} />
          <NextButton onNext={next} />
        </div>
      ) : (
        <Goodbye profileId={profileId} phrases={phrases} passed={passed.current} started={started.current} onHome={onHome} />
      )}
    </div>
  );
}

const INTROS: Record<Exclude<PartId, 'reward'>, { han: string; pinyin: string; english: string; mood: Mood }> = {
  warmup: { han: '浇花！', pinyin: 'jiāo huā', english: "Let's water yesterday's flowers.", mood: 'happy' },
  discover: { han: '看！种子！', pinyin: 'kàn! zhǒngzi!', english: 'Look! A seed!', mood: 'cheer' },
  play: { han: '玩一玩！', pinyin: 'wán yi wán', english: 'Time to play!', mood: 'cheer' },
  speak: { han: '说一说！', pinyin: 'shuō yi shuō', english: 'Say it to me!', mood: 'happy' },
};

function Intro({ part, phrases, count, onGo }: { part: Exclude<PartId, 'reward'>; phrases: Phrase[]; count: number; onGo: () => void }) {
  const intro = INTROS[part];
  useEffect(() => {
    if (part === 'play') playFile(line(phrases, 'keep-going').audio);
  }, [part, phrases]);
  return (
    <div className="flex flex-col items-center gap-4">
      <Baobao mood={intro.mood} size={160} />
      <Speech han={intro.han} pinyin={intro.pinyin} english={intro.english} />
      {part === 'warmup' && <p className="text-3xl" aria-label={`${count} flowers to water`}>{'🌷'.repeat(Math.min(count, 10))}</p>}
      <NextButton onNext={onGo} />
    </div>
  );
}

function SpeakToday({ phrase }: { phrase: Phrase }) {
  return (
    <button
      type="button"
      onClick={() => playFile(phrase.audio)}
      aria-label={`Listen: ${phrase.english}`}
      className="flex flex-col items-center rounded-3xl bg-white px-6 py-3 shadow-md active:scale-95"
    >
      <span className="text-6xl" aria-hidden="true">
        {phrase.icon}
      </span>
      <span className="text-lg">{phrase.syllables.map((s) => s.written).join(' ')}</span>
      <span className="han text-4xl">{phrase.chars}</span>
    </button>
  );
}

function SkipPlay({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="text-7xl">🌱</span>
      <p className="text-sm text-ink/50">Games open once three flowers have grown.</p>
      <NextButton onNext={onNext} />
    </div>
  );
}

function NextButton({ onNext }: { onNext: () => void }) {
  return (
    <button
      type="button"
      onClick={onNext}
      aria-label="Next"
      className="flex size-20 items-center justify-center rounded-full bg-[#ffe8a3] text-4xl shadow-md active:scale-95"
    >
      ▶
    </button>
  );
}

// Open the gift, see the garden, and leave with a reason to come back tomorrow.
function Goodbye({ profileId, phrases, passed, started, onHome }: { profileId: number; phrases: Phrase[]; passed: number; started: number; onHome: () => void }) {
  const [open, setOpen] = useState(false);
  const [flowers, setFlowers] = useState<{ char: string; bloom: 'bloom' | 'open' | 'sleepy' }[]>([]);
  const [tomorrow, setTomorrow] = useState<string | null>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    store.addTime(profileId, performance.now() - started);
    (async () => {
      setFlowers(await store.garden(profileId));
      // The character whose next card comes due first.
      const cards = await store.cards(profileId);
      const soon = cards.filter((c) => c.card.due.getTime() > Date.now()).sort((a, b) => a.card.due.getTime() - b.card.due.getTime())[0];
      setTomorrow(soon?.char ?? null);
    })();
  }, [profileId, started]);

  const unwrap = () => {
    setOpen(true);
    chime();
    playFile(line(phrases, 'great').audio).then(() => setTimeout(() => playFile(line(phrases, 'see-you-tomorrow').audio), 300));
  };

  if (!open) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Baobao mood="cheer" size={150} />
        <motion.button
          type="button"
          onClick={unwrap}
          aria-label="Open the gift"
          className="text-9xl"
          animate={{ rotate: [0, -6, 6, -6, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.8 }}
        >
          🎁
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Baobao mood="happy" size={130} />
      <Speech han="明天见！" pinyin="míngtiān jiàn" english={tomorrow ? `Your ${tomorrow} seedling will bloom tomorrow!` : 'See you tomorrow!'}>
        {tomorrow && <span className="han mt-1 block text-5xl">{tomorrow} 🌱</span>}
      </Speech>
      <p className="text-3xl" aria-label={`${passed} cards passed today`}>
        {'⭐'.repeat(Math.min(passed, 13))}
      </p>
      <div className="flex flex-wrap justify-center">
        {flowers.slice(-8).map((f) => (
          <Flower key={f.char} char={f.char} bloom={f.bloom} size={64} />
        ))}
      </div>
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
