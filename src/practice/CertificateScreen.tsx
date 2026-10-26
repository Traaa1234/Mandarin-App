import { useEffect, useState } from 'react';
import Baobao from '../components/Baobao';
import { useIndex } from '../data/useData';
import { islands, type Island } from './garden';
import { useProfile } from './ProfileContext';
import { store } from './store';

// A printable certificate for a finished island.
export default function CertificateScreen({ islandId, onBack }: { islandId: number; onBack: () => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [island, setIsland] = useState<Island | null>(null);

  useEffect(() => {
    if (index && current) store.learned(current.id!).then((l) => setIsland(islands(index, l).find((i) => i.id === islandId) ?? null));
  }, [index, current, islandId]);

  if (!index || !island || island.state !== 'done') return null;
  const chars = index.stages.find((s) => s.id === islandId)?.chars ?? [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-4 px-4 py-6 text-center">
      <div className="flex w-full justify-between print:hidden">
        <button type="button" onClick={onBack} aria-label="Back" className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95">
          ←
        </button>
        <button type="button" onClick={() => window.print()} aria-label="Print" className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95">
          🖨️
        </button>
      </div>
      <section className="flex w-full flex-col items-center gap-3 rounded-3xl border-8 border-double border-[#f59f00] bg-white p-6">
        <p className="han text-4xl font-bold">
          <span className="block text-base font-normal">jiǎngzhuàng</span>奖状
        </p>
        <p className="text-lg">Certificate</p>
        <p className="text-7xl">{current?.animal}</p>
        <p className="text-2xl font-bold">{island.island}</p>
        <p className="han text-3xl leading-relaxed">{chars.join(' ')}</p>
        <Baobao mood="cheer" size={110} outfit={null} />
        <p className="text-sm text-ink/60">{new Date().toLocaleDateString()}</p>
      </section>
    </main>
  );
}
