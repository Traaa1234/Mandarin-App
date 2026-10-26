import SpeakButton from '../../components/SpeakButton';
import type { CharData, DataIndex } from '../../data/types';
import { toneClass } from '../../lib/tones';

const MAX_FAMILY = 6;

// Panel 5: characters that contain this one. Once child profiles exist this
// list is limited to the stages the child has reached.
export default function FamilyPanel({
  data,
  index,
  onOpen,
}: {
  data: CharData;
  index: DataIndex;
  onOpen: (char: string) => void;
}) {
  const family = (index.families[data.character] ?? []).slice(0, MAX_FAMILY);

  if (!family.length) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-7xl" aria-hidden="true">
          🌱
        </span>
        <p className="text-sm text-ink/50">No family members yet. They grow in later stages.</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {family.map((c) => {
        const entry = index.chars[c];
        return (
          <li key={c} className="relative">
            <button
              type="button"
              onClick={() => onOpen(c)}
              aria-label={`${c}, ${entry.gloss}`}
              className="flex w-full flex-col items-center rounded-2xl bg-white p-3 shadow-sm active:scale-95"
            >
              <span className={`text-base py ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
              <span className="han text-6xl leading-tight">{c}</span>
              <span className="en text-xs text-ink/50">{entry.gloss}</span>
            </button>
            <div className="absolute top-1 right-1">
              <SpeakButton text={c} size="sm" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
