import { speak, useCanSpeak, type Lang } from '../lib/speech';

// Hidden when the device has no voice for the language, as the spec asks.
export default function SpeakButton({
  text,
  size = 'md',
  lang = 'zh-CN',
  icon = '🔊',
}: {
  text: string;
  size?: 'sm' | 'md';
  lang?: Lang;
  icon?: string;
}) {
  const canSpeak = useCanSpeak(lang);
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { lang });
      }}
      aria-label={`Play ${text}`}
      className={`${size === 'sm' ? 'size-14 text-2xl' : 'size-16 text-3xl'} flex shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95`}
    >
      {icon}
    </button>
  );
}
