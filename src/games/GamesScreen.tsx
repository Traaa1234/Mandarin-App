import { useEffect, useState } from 'react';
import { useIndex } from '../data/useData';
import { dragonAvailable } from '../practice/calendar';
import { useProfile } from '../practice/ProfileContext';
import ProfilePicker from '../practice/ProfilePicker';
import { store } from '../practice/store';
import GameHost from './GameHost';
import { DRAGON, GAMES, type GameInfo } from './registry';

// All the mini-games. Locked ones show how many flowers they need.
export default function GamesScreen({ onHome }: { onHome: () => void }) {
  const index = useIndex();
  const { current } = useProfile();
  const [learned, setLearned] = useState<string[] | null>(null);
  const [dragon, setDragon] = useState(false);
  const [playing, setPlaying] = useState<GameInfo | null>(null);

  useEffect(() => {
    if (!current || !index) return;
    (async () => {
      const set = await store.learned(current.id!);
      setLearned(Object.keys(index.chars).filter((c) => set.has(c)));
      setDragon(dragonAvailable(new Date(), await store.getMeta<string | null>(current.id!, 'dragon-week', null)));
    })();
  }, [current, index, playing]);

  const games = dragon ? [DRAGON, ...GAMES] : GAMES;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (playing ? setPlaying(null) : onHome())}
          aria-label={playing ? 'Back to the games' : 'Home'}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <h1 className="han text-3xl font-bold">
          <span className="block text-base font-normal">yóuxì</span>游戏
        </h1>
        {current && <span className="ml-auto text-5xl">{current.animal}</span>}
      </header>
      {!current ? (
        <ProfilePicker onDone={() => {}} />
      ) : !index || !learned ? null : playing ? (
        <GameHost game={playing} index={index} learned={learned} profileId={current.id!} onFinish={() => setPlaying(null)} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {games.map((g) => {
            const ready = g.ready(learned, index);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => ready && setPlaying(g)}
                  disabled={!ready}
                  aria-label={ready ? g.english : `${g.english}, locked`}
                  className={`flex min-h-36 w-full flex-col items-center justify-center gap-1 rounded-3xl p-3 shadow-md active:scale-95 disabled:opacity-50 ${g.id === 'dragon' ? 'bg-[#ffe8a3]' : 'bg-white'}`}
                >
                  <span className="text-5xl" aria-hidden="true">
                    {ready ? g.icon : '🔒'}
                  </span>
                  <span className="text-sm">{g.pinyin}</span>
                  <span className="han -mt-1 text-xl font-bold">{g.han}</span>
                  <span className="text-xs text-ink/50">{g.english}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
