import { useEffect, useState } from 'react';
import Baobao from '../components/Baobao';
import { useIndex } from '../data/useData';
import { islands, type Island } from './garden';
import { useProfile } from './ProfileContext';
import ProfilePicker from './ProfilePicker';
import { store } from './store';
import TodayButton from './TodayButton';

const ISLAND_ICON = ['🌼', '✏️', '🏰', '🌲', '🍲', '⚓', '🏘️'];

// The seven learning stages as garden islands, unlocked in order. Tap an
// island to see its characters.
export default function MapScreen({
  onHome,
  onCertificate,
  onChar,
}: {
  onHome: () => void;
  onCertificate: (id: number) => void;
  onChar: (c: string) => void;
}) {
  const index = useIndex();
  const { current } = useProfile();
  const [list, setList] = useState<Island[] | null>(null);
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (!index || !current) return;
    (async () => {
      const got = await store.learned(current.id!);
      const list = islands(index, got);
      setList(list);
      setLearned(got);
      setOpen((o) => o ?? list.find((i) => i.state === 'open' && i.total > 0)?.id ?? null);
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
        <h1 lang="zh-Hans" className="han text-3xl font-bold">
          <span className="block text-base font-normal">dìtú</span>地图
        </h1>
      </header>
      {!current ? (
        <ProfilePicker onDone={() => {}} />
      ) : (
        <ol className="flex flex-col items-center gap-3 rounded-3xl bg-[#a5d8ff] p-4">
          {list?.map((island, i) => {
            const chars = index?.stages.find((s) => s.id === island.id)?.chars ?? [];
            return (
              <li key={island.id} className={`flex w-full max-w-sm flex-col gap-2 ${i % 2 ? 'self-end' : 'self-start'}`}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(open === island.id ? null : island.id)}
                    aria-expanded={open === island.id}
                    aria-label={`${island.island}: ${island.state}, ${island.learned} of ${island.total}`}
                    className={`flex min-h-16 flex-1 items-center gap-3 rounded-full px-4 py-3 text-left shadow-md active:scale-95 ${
                      island.state === 'done' ? 'bg-[#c3e6b4]' : island.state === 'open' ? 'bg-[#fff9db]' : 'bg-white/60'
                    }`}
                  >
                    <span className="text-4xl" aria-hidden="true">
                      {island.state === 'locked' ? '🔒' : island.state === 'building' ? '🚧' : ISLAND_ICON[i]}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-bold">{island.island}</span>
                      {island.total > 0 && island.state !== 'building' && (
                        <span className="text-sm text-ink/70">
                          {island.learned} / {island.total} 🌷
                        </span>
                      )}
                    </span>
                    {i === here && (
                      <span className="ml-auto">
                        <Baobao size={48} />
                      </span>
                    )}
                  </button>
                  {island.state === 'done' && (
                    <button
                      type="button"
                      onClick={() => onCertificate(island.id)}
                      aria-label={`Certificate for ${island.island}`}
                      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-3xl shadow-sm active:scale-95"
                    >
                      📜
                    </button>
                  )}
                </div>
                {open === island.id && (
                  <div className="rounded-3xl bg-white p-3 shadow-sm">
                    {island.state === 'locked' ? (
                      <p className="text-center text-sm">🔒 Finish the island before this one to open it.</p>
                    ) : island.state === 'building' ? (
                      <p className="text-center text-sm">🚧 This island is still being built. It comes in a later update.</p>
                    ) : !chars.length ? (
                      <p className="text-center text-sm">No characters to collect here: strokes are practised while writing.</p>
                    ) : (
                      <>
                        <ul className="flex flex-wrap justify-center gap-2">
                          {chars.map((c) => (
                            <li key={c}>
                              <button
                                type="button"
                                onClick={() => onChar(c)}
                                aria-label={`${c}${learned.has(c) ? ', learned' : ''}`}
                                className={`flex size-14 items-center justify-center rounded-2xl text-3xl shadow-sm active:scale-95 ${
                                  learned.has(c) ? 'bg-[#c3e6b4]' : 'bg-[#f1f3f5] text-ink/60'
                                }`}
                              >
                                <span lang="zh-Hans" className="han">{c}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        {island.state === 'open' && (
                          <div className="mt-3">
                            <TodayButton hint="Green characters are flowers in the garden. The grey ones are planted one by one in today's adventure; tap any to explore it." />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
