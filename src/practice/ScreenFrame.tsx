import type { ReactNode } from 'react';
import { useProfile } from './ProfileContext';
import ProfilePicker from './ProfilePicker';

// The shared frame of the game-layer screens: back button, title, the child's avatar.
export default function ScreenFrame({
  han,
  pinyin,
  onBack,
  backLabel = 'Home',
  children,
}: {
  han: string;
  pinyin: string;
  onBack: () => void;
  backLabel?: string;
  children: ReactNode;
}) {
  const { current } = useProfile();
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <h1 className="han text-3xl font-bold">
          <span className="py block text-base font-normal">{pinyin}</span>
          {han}
        </h1>
        {current && <span className="ml-auto text-5xl">{current.animal}</span>}
      </header>
      {current ? children : <ProfilePicker onDone={() => {}} />}
    </main>
  );
}
