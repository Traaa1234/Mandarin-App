import type { ReactNode } from 'react';

export function PageHeader({ han, pinyin, english, onBack }: { han: string; pinyin: string; english: string; onBack: () => void }) {
  return (
    <header className="mb-5 flex items-center gap-4">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
      >
        ←
      </button>
      <h1 lang="zh-Hans" className="han text-3xl font-bold">
        <span className="block text-base font-normal">{pinyin}</span>
        {han}
      </h1>
      <span className="text-sm text-ink/70">{english}</span>
    </header>
  );
}

// A large tap tile for one sound. Feedback within 100 ms: it bounces on press.
export function SoundTile({
  label,
  onPress,
  active,
  color,
  children,
  ariaLabel,
}: {
  label?: string;
  onPress: () => void;
  active?: boolean;
  color?: string;
  children?: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={ariaLabel ?? label}
      className={`flex min-h-16 min-w-16 items-center justify-center rounded-2xl px-3 text-3xl font-semibold shadow-sm transition active:scale-90 ${
        active ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : 'bg-white'
      }`}
      style={color ? { color } : undefined}
    >
      {children ?? label}
    </button>
  );
}

// Encouraging result line under a game: stars, never a red X.
export function Stars({ count, of }: { count: number; of: number }) {
  return (
    <p className="text-3xl" aria-label={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => (i < count ? '⭐' : '☆')).join(' ')}
    </p>
  );
}
