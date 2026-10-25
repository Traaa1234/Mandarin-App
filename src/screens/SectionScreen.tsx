import { useEffect, useState } from 'react';
import type { DataIndex } from '../data/types';
import { toneClass } from '../lib/tones';
import { SECTIONS, type SectionId } from '../sections';

export default function SectionScreen({ id, onHome }: { id: SectionId; onHome: () => void }) {
  const section = SECTIONS.find((s) => s.id === id)!;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onHome}
          aria-label="Home"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <span className={`${section.color} block size-16 rounded-2xl p-2`}>{section.icon}</span>
        <h1 className="han text-3xl font-bold">{section.han}</h1>
      </header>
      {id === 'roots' ? <RootTiles /> : <ComingSoon />}
    </main>
  );
}

// The stage-1 picture roots, straight from the generated data. The detail
// screen for each character comes in the next milestone.
function RootTiles() {
  const [index, setIndex] = useState<DataIndex | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/index.json`)
      .then((r) => r.json() as Promise<DataIndex>)
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  if (!index) return null;
  const roots = index.stages.find((s) => s.id === 1)?.chars ?? [];

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {roots.map((c) => {
        const entry = index.chars[c];
        return (
          <li
            key={c}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-white shadow-sm"
          >
            <span className={`text-base ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
            <span className="han text-5xl leading-tight">{c}</span>
            <span className="text-xs text-ink/50">{entry.gloss}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ComingSoon() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="han text-8xl" aria-hidden="true">
        🌱
      </span>
      <p className="han text-2xl">
        <span className="block text-base">kuài lái le</span>
        快来了！
      </p>
      <p className="text-sm text-ink/50">Coming soon</p>
    </div>
  );
}
