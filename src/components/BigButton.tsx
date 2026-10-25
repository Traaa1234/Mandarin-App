import type { ReactNode } from 'react';

export default function BigButton({
  onClick,
  label,
  pressed,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={`flex min-h-16 min-w-16 items-center justify-center rounded-2xl px-3 text-3xl shadow-md transition active:scale-95 disabled:opacity-40 ${
        pressed ? 'bg-[#ffe8a3]' : 'bg-white'
      }`}
    >
      {children}
    </button>
  );
}
