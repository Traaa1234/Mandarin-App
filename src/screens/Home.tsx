import { useEffect, useState } from 'react';
import Baobao from '../components/Baobao';
import { activeFestival, type Festival } from '../practice/festivals';
import { useProfile } from '../practice/ProfileContext';
import { store } from '../practice/store';
import { sunshineStreak, weekSuns, WEEKLY_GOAL } from '../practice/streak';
import { SECTIONS, type SectionId } from '../sections';

export type HomeTarget = SectionId | 'today' | 'garden' | 'map' | 'games' | 'album' | 'shop' | 'parents' | 'festival' | 'credits';

const SHORTCUTS: { id: HomeTarget; icon: string; label: string }[] = [
  { id: 'garden', icon: '🌷', label: 'My garden' },
  { id: 'games', icon: '🎮', label: 'Games' },
  { id: 'map', icon: '🗺️', label: 'Map' },
  { id: 'album', icon: '📒', label: 'Album' },
  { id: 'shop', icon: '🏪', label: 'Shop' },
];

export default function Home({ onOpen }: { onOpen: (id: HomeTarget) => void }) {
  const { current, choose } = useProfile();
  const [sun, setSun] = useState<{ streak: number; week: boolean[] } | null>(null);
  const festival: Festival | null = activeFestival(new Date());

  useEffect(() => {
    if (!current) {
      setSun(null);
      return;
    }
    store.practisedDays(current.id!).then((days) => setSun({ streak: sunshineStreak(days, new Date()), week: weekSuns(days, new Date()) }));
  }, [current]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <div className="mb-2 flex items-center gap-3">
        {sun && (
          <div role="group"
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm"
            aria-label={`Sunshine streak ${sun.streak} days. This week ${sun.week.filter(Boolean).length} of ${WEEKLY_GOAL} sunny days`}
          >
            <span className="text-xl font-bold">☀️ {sun.streak}</span>
            <span className="text-base tracking-tight" aria-hidden="true">
              {sun.week.map((lit, i) => (
                <span key={i} className={lit ? '' : 'opacity-25 grayscale'}>
                  🌞
                </span>
              ))}
            </span>
          </div>
        )}
        {current && (
          <button
            type="button"
            onClick={() => choose(null)}
            aria-label={`Playing as ${current.animal}. Change player`}
            className="ml-auto flex size-16 items-center justify-center rounded-full bg-white text-4xl shadow-md active:scale-95"
          >
            {current.animal}
          </button>
        )}
      </div>
      <h1 lang="zh-Hans" className="han mb-4 text-center text-4xl font-bold">
        <span className="py block text-base font-normal">hànzì huāyuán</span>
        汉字花园
        <span className="en mt-1 block text-base font-normal text-ink/70">Hanzi Garden</span>
      </h1>
      {festival && (
        <button
          type="button"
          onClick={() => onOpen('festival')}
          aria-label={festival.name}
          className="mb-3 flex min-h-16 items-center justify-center gap-3 rounded-3xl bg-[#ffe3e3] px-4 shadow-md active:scale-95"
        >
          <span className="text-4xl">{festival.icon}</span>
          <span lang="zh-Hans" className="han text-2xl font-bold">
            <span className="py block text-sm font-normal">{festival.pinyin}</span>
            {festival.han}
          </span>
        </button>
      )}
      <button
        type="button"
        onClick={() => onOpen('today')}
        aria-label="Today's adventure"
        className="mb-3 flex min-h-28 items-center justify-center gap-3 rounded-3xl bg-[#f59f00] px-3 text-ink shadow-md transition active:scale-95"
      >
        <Baobao size={80} mood="happy" />
        <span lang="zh-Hans" className="han text-4xl font-bold">
          <span className="py block text-base font-normal">jīntiān</span>今天
        </span>
      </button>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {SHORTCUTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s.id)}
            aria-label={s.label}
            className="flex h-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
          >
            {s.icon}
          </button>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-4 sm:gap-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s.id)}
            aria-label={s.english}
            className={`${s.color} flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl p-4 shadow-md transition active:scale-95`}
          >
            <span className="block size-20 sm:size-28">{s.icon}</span>
            <span className="py text-base">{s.pinyin}</span>
            <span lang="zh-Hans" className="han -mt-2 text-3xl font-bold sm:text-4xl">{s.han}</span>
            <span className="en text-sm">{s.english}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={() => onOpen('parents')} className="min-h-14 px-4 text-sm text-ink/70 underline">
          For grown-ups
        </button>
        <button type="button" onClick={() => onOpen('credits')} className="min-h-14 px-4 text-sm text-ink/70 underline">
          About and credits
        </button>
      </div>
    </main>
  );
}
