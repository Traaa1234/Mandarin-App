import { useEffect, useState } from 'react';
import Baobao from '../components/Baobao';
import { chime } from '../lib/sfx';
import { useProfile } from './ProfileContext';
import { SHOP } from './rewards';
import ScreenFrame from './ScreenFrame';
import { store } from './store';
import TodayButton from './TodayButton';

// Spend seeds (earned only by playing) on garden decorations, Bǎobao outfits and backgrounds.
export default function ShopScreen({ onHome }: { onHome: () => void }) {
  const { current, outfit, dress, background, paint } = useProfile();
  const [seeds, setSeeds] = useState(0);
  const [owned, setOwned] = useState<Set<string>>(new Set());

  const reload = async () => {
    if (!current) return;
    setSeeds(await store.seeds(current.id!));
    setOwned(await store.owned(current.id!));
  };
  useEffect(() => {
    reload();
  }, [current]);

  const tap = async (id: string, price: number) => {
    const [kind, value] = id.split(':');
    if (!owned.has(id)) {
      if (!(await store.buy(current!.id!, id, price))) return;
      chime();
      await reload();
    }
    if (kind === 'outfit') dress(outfit === value ? null : value);
    if (kind === 'background') paint(background === value ? 'meadow' : value);
  };

  return (
    <ScreenFrame han="商店" pinyin="shāngdiàn" onBack={onHome}>
      <div className="mb-4 flex items-center justify-between rounded-3xl bg-white px-4 py-2 shadow-sm">
        <Baobao size={90} />
        <p className="text-3xl font-bold" aria-label={`${seeds} seeds`}>
          {seeds} 🌰
        </p>
      </div>
      {SHOP.some((i) => !owned.has(i.id)) && seeds < Math.min(...SHOP.filter((i) => !owned.has(i.id)).map((i) => i.price)) && (
        <div className="mb-4">
          <TodayButton hint="Spend seeds 🌰 here on garden decorations, outfits for Bǎobao and backgrounds. Seeds are earned by playing today's adventure and the games." />
        </div>
      )}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {SHOP.map((item) => {
          const have = owned.has(item.id);
          const [kind, value] = item.id.split(':');
          const wearing = (kind === 'outfit' && outfit === value) || (kind === 'background' && background === value);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => tap(item.id, item.price)}
                disabled={!have && seeds < item.price}
                aria-label={`${item.label}${have ? (kind === 'decor' ? ', in your garden' : wearing ? ', in use' : ', owned') : `, ${item.price} seeds`}`}
                className={`flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-3xl p-2 shadow-md active:scale-95 disabled:opacity-40 ${
                  wearing ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : have ? 'bg-[#c3e6b4]' : 'bg-white'
                }`}
              >
                <span className="text-5xl">{item.icon}</span>
                <span className="text-sm">{have ? '✓' : `${item.price} 🌰`}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </ScreenFrame>
  );
}
