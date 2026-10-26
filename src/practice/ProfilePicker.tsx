import { useState } from 'react';
import { MAX_PROFILES } from './db';
import { useProfile } from './ProfileContext';

export const ANIMALS = ['🐼', '🐯', '🐰', '🐸', '🦊', '🐨', '🐧', '🐵'];

// Pick who is playing, or add a child by choosing an animal. No names or ages.
export default function ProfilePicker({ onDone }: { onDone: () => void }) {
  const { profiles, choose, add } = useProfile();
  const [adding, setAdding] = useState(false);
  if (!profiles) return null;

  const taken = new Set(profiles.map((p) => p.animal));
  const showAdd = adding || profiles.length === 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <p lang="zh-Hans" className="han text-3xl">
        <span className="block text-center text-base">nǐ shì shéi?</span>你是谁？
      </p>
      {!showAdd && (
        <div className="flex flex-wrap justify-center gap-4">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                choose(p.id!);
                onDone();
              }}
              aria-label={`Play as ${p.animal}`}
              className="flex size-28 items-center justify-center rounded-full bg-white text-7xl shadow-md active:scale-95"
            >
              {p.animal}
            </button>
          ))}
          {profiles.length < MAX_PROFILES && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              aria-label="Add a child"
              className="flex size-28 items-center justify-center rounded-full border-4 border-dashed border-[#d9c7a3] text-6xl text-ink/70 active:scale-95"
            >
              +
            </button>
          )}
        </div>
      )}
      {showAdd && (
        <div className="grid grid-cols-4 gap-3">
          {ANIMALS.filter((a) => !taken.has(a)).map((a) => (
            <button
              key={a}
              type="button"
              onClick={async () => {
                await add(a);
                setAdding(false);
                onDone();
              }}
              aria-label={`Be the ${a}`}
              className="flex size-20 items-center justify-center rounded-full bg-white text-5xl shadow-md active:scale-95"
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
