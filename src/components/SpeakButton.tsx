import { speak, useCanSpeak } from '../lib/speech';

// Hidden when the device has no Chinese voice, as the spec asks.
export default function SpeakButton({ text, size = 'md' }: { text: string; size?: 'sm' | 'md' }) {
  const canSpeak = useCanSpeak();
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={`Play ${text}`}
      className={`${size === 'sm' ? 'size-14 text-2xl' : 'size-16 text-3xl'} flex shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95`}
    >
      🔊
    </button>
  );
}
