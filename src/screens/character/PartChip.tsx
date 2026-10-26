import type { DataIndex } from '../../data/types';
import { toneClass } from '../../lib/tones';

// A part of a character: tap it to open that part's own screen.
export default function PartChip({
  char,
  color,
  index,
  onOpen,
  tag,
}: {
  char: string;
  color?: string;
  index: DataIndex;
  onOpen: (char: string) => void;
  tag?: string;
}) {
  const entry = index.chars[char];
  return (
    <button
      type="button"
      onClick={() => onOpen(char)}
      disabled={!entry}
      aria-label={entry ? `${char}, ${entry.gloss}` : char}
      className="flex min-h-16 min-w-20 flex-col items-center rounded-2xl bg-white px-3 py-2 shadow-sm active:scale-95 disabled:active:scale-100"
    >
      {entry && <span className={`text-sm py ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>}
      <span className="han text-4xl leading-tight" style={{ color }}>
        {char}
      </span>
      {entry && <span className="en text-xs text-ink/50">{entry.gloss}</span>}
      {tag && <span className="mt-1 text-xs font-bold">{tag}</span>}
    </button>
  );
}
