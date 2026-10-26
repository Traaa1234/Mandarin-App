import { useEffect, useState } from 'react';
import { useIndex } from '../data/useData';
import { KINDS, kindsFor, type Kind } from './kinds';
import { useProfile } from './ProfileContext';
import { BADGES, type Stats } from './rewards';
import ScreenFrame from './ScreenFrame';
import { childStats } from './stats';
import { store } from './store';

// The collection album: a sticker slot per character, a silhouette until it is
// learned, then filled with its picture. Each sticker earns up to 4 stars (See,
// Hear, Write, Tone), so there is always one more to chase. Then badges and stickers.
export default function AlbumScreen({ onHome }: { onHome: () => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [stars, setStars] = useState<Map<string, Set<Kind>>>(new Map());
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [stickers, setStickers] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!current || !index) return;
    (async () => {
      setStars(await store.stars(current.id!));
      setLearned(await store.learned(current.id!));
      setStickers([...(await store.owned(current.id!))].filter((i) => i.startsWith('sticker:')));
      setStats(await childStats(current.id!, index));
    })();
  }, [current, index]);

  if (!index) return null;
  const base = import.meta.env.BASE_URL;

  return (
    <ScreenFrame han="相册" pinyin="xiàngcè" onBack={onHome}>
      <ul className="mb-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {Object.entries(index.chars)
          // Festival characters only visit during their festival, so they get no slot.
          .filter(([, entry]) => entry.role !== 'festival')
          .map(([c, entry]) => {
          const got = learned.has(c);
          const kinds = kindsFor(entry);
          const earned = KINDS.filter((k) => kinds.includes(k) && stars.get(c)?.has(k)).length;
          return (
            <li key={c} className={`flex flex-col items-center rounded-2xl p-1 ${got ? 'bg-white shadow-sm' : 'bg-[#e9dfcc]'}`} aria-label={got ? `${c}, ${earned} of ${kinds.length} stars` : 'Not learned yet'}>
              {got && entry.picture ? (
                <img src={`${base}${entry.picture}`} alt="" className="aspect-square w-full rounded-xl" />
              ) : (
                <span lang="zh-Hans" className={`han flex aspect-square w-full items-center justify-center text-4xl ${got ? '' : 'text-[#cdbf9f] blur-[2px]'}`}>{c}</span>
              )}
              <span className="text-xs leading-none" aria-hidden="true">
                {got ? '⭐'.repeat(earned) + '☆'.repeat(kinds.length - earned) : ''}
              </span>
            </li>
          );
        })}
      </ul>
      {stats && (
        <section aria-label="Badges" className="mb-6">
          <ul className="grid grid-cols-5 gap-2">
            {BADGES.map((b) => {
              const has = b.earned(stats);
              return (
                <li key={b.id} className={`flex aspect-square items-center justify-center rounded-full text-3xl ${has ? 'bg-[#ffe8a3] shadow-md' : 'bg-[#e9dfcc] opacity-40 grayscale'}`} aria-label={`${b.label}${has ? '' : ', not yet'}`} title={b.label}>
                  {b.icon}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {stickers.length > 0 && (
        <section aria-label="Stickers" className="flex flex-wrap gap-2 text-4xl">
          {stickers.map((s) => (
            <span key={s} aria-label={s.replace('sticker:', 'Sticker ')}>
              {s.startsWith('sticker:dragon') ? '🐉' : s.startsWith('sticker:island') ? '🏝️' : s.startsWith('sticker:festival') ? '🏮' : s.replace('sticker:', '')}
            </span>
          ))}
        </section>
      )}
    </ScreenFrame>
  );
}
