import { playKeys } from '../lib/audio';
import { speak, useCanSpeak, type Lang } from '../lib/speech';
import { syllableKey } from '../lib/syllable';

// A speaker button. With `pinyin` (syllables separated by spaces) it plays the
// app's own native recordings and is always shown. Without it, it uses the
// device's voice and is hidden when the device has none.
export default function SpeakButton({
  text,
  pinyin,
  size = 'md',
  lang = 'zh-CN',
  icon = '🔊',
}: {
  text: string;
  pinyin?: string;
  size?: 'sm' | 'md';
  lang?: Lang;
  icon?: string;
}) {
  const canSpeak = useCanSpeak(lang);
  if (!pinyin && !canSpeak) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (pinyin) playKeys(pinyin.split(/\s+/).filter(Boolean).map(syllableKey), { gap: 60 });
        else speak(text, { lang });
      }}
      aria-label={`Play ${text}`}
      className={`${size === 'sm' ? 'size-14 text-2xl' : 'size-16 text-3xl'} flex shrink-0 items-center justify-center rounded-full bg-white shadow-md active:scale-95`}
    >
      {icon}
    </button>
  );
}
