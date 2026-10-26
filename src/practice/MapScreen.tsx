import { useEffect, useState } from 'react';
import Baobao from '../components/Baobao';
import { useIndex } from '../data/useData';
import { islands, type Island } from './garden';
import { useProfile } from './ProfileContext';
import { store } from './store';

const ISLAND_ICON = ['🌼', '✏️', '🏰', '🌲', '🍲', '⚓', '🏘️'];

// The seven learning stages as garden islands, unlocked in order.
export default function MapScreen({ onHome, onCertificate }: { onHome: () => void; onCertificate: (id: number) => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [list, setList] = useState<Island[] | null>(null);

  useEffect(() => {
    if (!index || !current) return;
    (async () => {
      const list = islands(index, await store.learned(current.id!));
      setList(list);
      // Finishing an island earns its sticker.
      for (const i of list) if (i.state === 'done') await store.give(current.id!, `sticker:island-${i.id}`);
    })();
  }, [index, current]);

  const here = list?.findIndex((i) => i.state === 'open') ?? -1;

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
          <span className="block text-base font-normal">dìtú</span>地图
        </h1>
      </header>
      <ol className="flex flex-col items-center gap-3 rounded-3xl bg-[#a5d8ff] p-4">
        {list?.map((island, i) => (
          <li
            key={island.id}
            className={`flex w-full max-w-sm items-center gap-3 rounded-full px-4 py-3 shadow-md ${
              island.state === 'done' ? 'bg-[#c3e6b4]' : island.state === 'open' ? 'bg-[#fff9db]' : 'bg-white/60'
            } ${i % 2 ? 'self-end' : 'self-start'}`}
            aria-label={`${island.island}: ${island.state}, ${island.learned} of ${island.total}`}
          >
            <span className="text-4xl" aria-hidden="true">
              {island.state === 'locked' ? '🔒' : island.state === 'building' ? '🚧' : ISLAND_ICON[i]}
            </span>
            <span className="flex flex-col">
              <span className="font-bold">{island.island}</span>
              {island.total > 0 && island.state !== 'building' && (
                <span className="text-sm text-ink/60">
                  {island.learned} / {island.total} 🌷
                </span>
              )}
            </span>
            {i === here && (
              <span className="ml-auto">
                <Baobao size={48} />
              </span>
            )}
            {island.state === 'done' && (
              <button
                type="button"
                onClick={() => onCertificate(island.id)}
                aria-label={`Certificate for ${island.island}`}
                className="ml-auto flex size-14 items-center justify-center rounded-full bg-white text-3xl shadow-sm active:scale-95"
              >
                📜
              </button>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
