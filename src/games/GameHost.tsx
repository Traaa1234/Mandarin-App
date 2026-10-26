import { Suspense, useEffect, useRef, useState } from 'react';
import Baobao, { Speech } from '../components/Baobao';
import type { DataIndex } from '../data/types';
import { store } from '../practice/store';
import type { GameInfo } from './registry';

// Plays one game, then shows stars (always at least one) and the seeds earned.
export default function GameHost({
  game,
  index,
  learned,
  profileId,
  onFinish,
}: {
  game: GameInfo;
  index: DataIndex;
  learned: string[];
  profileId: number;
  onFinish: () => void;
}) {
  const [result, setResult] = useState<{ stars: number; seeds: number } | null>(null);
  const saved = useRef(false);
  const Game = game.component;

  const done = async (score: number, max: number) => {
    if (saved.current) return;
    saved.current = true;
    const stars = max ? Math.max(1, Math.round((3 * score) / max)) : 1;
    // A seed for every point, and one for playing at all.
    const seeds = score + 1;
    await store.addSeeds(profileId, seeds);
    await store.log(profileId, 'game', { id: game.id, score, max });
    setResult({ stars, seeds });
  };

  useEffect(() => {
    saved.current = false;
  }, [game.id]);

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Baobao mood="cheer" size={130} />
        <Speech han="太棒了！" pinyin="tài bàng le" english={game.english} />
        <p className="text-5xl" aria-label={`${result.stars} stars`}>
          {'⭐'.repeat(result.stars)}
        </p>
        <p className="text-3xl" aria-label={`${result.seeds} seeds`}>
          +{result.seeds} 🌰
        </p>
        <button
          type="button"
          onClick={onFinish}
          aria-label="Next"
          className="flex size-20 items-center justify-center rounded-full bg-[#ffe8a3] text-4xl shadow-md active:scale-95"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center">
        <span className="text-3xl" aria-hidden="true">
          {game.icon}
        </span>{' '}
        <span className="han text-2xl font-bold">{game.han}</span> <span className="text-sm text-ink/50">{game.pinyin}</span>
      </p>
      <Suspense fallback={null}>
        <Game index={index} learned={learned} profileId={profileId} onDone={done} />
      </Suspense>
    </div>
  );
}

