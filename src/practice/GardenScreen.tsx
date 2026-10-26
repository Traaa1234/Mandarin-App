import { useEffect, useState } from 'react';
import Baobao, { Speech } from '../components/Baobao';
import Flower from '../components/Flower';
import { CHARS_PER_LEVEL, gardenLevel, LEVEL_DECOR, type Bloom } from './garden';
import { BACKGROUNDS } from './rewards';
import { useProfile } from './ProfileContext';
import { store } from './store';

// The child's garden: one flower per learned character. Tap a flower to visit
// its character. The garden gains something new every few characters.
export default function GardenScreen({ onHome, onChar }: { onHome: () => void; onChar: (c: string) => void }) {
  const { current, background } = useProfile();
  const [flowers, setFlowers] = useState<{ char: string; bloom: Bloom }[] | null>(null);
  const [decor, setDecor] = useState<string[]>([]);

  useEffect(() => {
    if (!current) return;
    store.garden(current.id!).then(setFlowers);
    store.owned(current.id!).then((o) => setDecor([...o].filter((i) => i.startsWith('decor:')).map((i) => i.slice(6))));
  }, [current]);

  const level = gardenLevel(flowers?.length ?? 0);
  const toNext = CHARS_PER_LEVEL - ((flowers?.length ?? 0) % CHARS_PER_LEVEL);

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
          <span className="block text-base font-normal">huāyuán</span>花园
        </h1>
        {current && <span className="ml-auto text-5xl">{current.animal}</span>}
      </header>

      {flowers && (
        <>
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-white px-4 py-2 shadow-sm">
            <span className="text-lg font-bold" aria-label={`Garden level ${level}`}>
              ⭐ {level}
            </span>
            <span className="text-2xl" aria-label="Garden decorations">
              {LEVEL_DECOR.slice(0, level).join(' ')}
            </span>
            <span className="text-sm text-ink/50" aria-label={`${toNext} more flowers to the next level`}>
              {'🌱'.repeat(toNext)}
            </span>
          </div>
          {flowers.length ? (
            <ul className="grid grid-cols-3 gap-2 rounded-3xl p-3 sm:grid-cols-5" style={{ background: BACKGROUNDS[background] ?? BACKGROUNDS.meadow }}>
              {decor.map((d) => (
                <li key={d} className="flex items-center justify-center text-5xl" aria-label="Decoration">
                  {d}
                </li>
              ))}
              {flowers.map((f) => (
                <li key={f.char} className="flex justify-center">
                  <button type="button" onClick={() => onChar(f.char)} aria-label={`${f.char}, ${f.bloom}`} className="active:scale-95">
                    <Flower char={f.char} bloom={f.bloom} size={84} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Baobao mood="happy" />
              <Speech han="种花吧！" pinyin="zhòng huā ba" english="Let's plant some flowers!" />
            </div>
          )}
        </>
      )}
    </main>
  );
}
