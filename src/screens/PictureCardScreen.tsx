import MnemonicCard from '../components/MnemonicCard';
import SpeakButton from '../components/SpeakButton';
import { useBoxSize } from '../components/useBoxSize';
import { useChar, useIndex } from '../data/useData';
import type { DataIndex } from '../data/types';
import { toneClass } from '../lib/tones';

// Characters with an approved picture, in learning order.
export const pictureChars = (index: DataIndex) =>
  Object.keys(index.chars).filter((c) => index.chars[c].picture);

// One picture card per screen, with its memory line, and arrows to the
// neighbouring cards.
export default function PictureCardScreen({
  char,
  onBack,
  onOpen,
  onRoots,
}: {
  char: string;
  onBack: () => void;
  onOpen: (char: string) => void;
  onRoots: (char: string) => void;
}) {
  const data = useChar(char);
  const index = useIndex();
  const cards = index ? pictureChars(index) : [];
  const size = useBoxSize(380);
  const at = cards.indexOf(char);
  const prev = at > 0 ? cards[at - 1] : null;
  const next = at >= 0 && at < cards.length - 1 ? cards[at + 1] : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-4 py-6">
      <header className="mb-4 flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        {data && (
          <>
            <div className="flex flex-col items-center leading-none">
              <span className={`text-lg py ${toneClass(data.pinyin)}`}>{data.pinyin}</span>
              <h1 className="han text-5xl">{char}</h1>
            </div>
            <span className="en text-ink/60">{data.gloss}</span>
            <span className="ml-auto">
              <SpeakButton text={char} />
            </span>
          </>
        )}
      </header>

      {data && (
        <>
          <MnemonicCard key={char} data={data} size={size} />
          <div className="mt-5 flex items-center gap-3">
            <p className="max-w-xs text-center text-lg">{data.mnemonic.story}</p>
            <SpeakButton text={data.mnemonic.story} lang="en" icon="💬" size="sm" />
          </div>
          <button
            type="button"
            onClick={() => onRoots(char)}
            aria-label={`Open ${char} in Character Roots`}
            className="mt-4 flex min-h-14 items-center gap-2 rounded-2xl bg-[#ffe8a3] px-4 text-2xl shadow-sm active:scale-95"
          >
            🌱 <span className="han">{char}</span>
          </button>
        </>
      )}

      <div className="mt-auto flex w-full justify-between pt-6">
        <button
          type="button"
          onClick={() => prev && onOpen(prev)}
          disabled={!prev}
          aria-label="Previous card"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => next && onOpen(next)}
          disabled={!next}
          aria-label="Next card"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </main>
  );
}
