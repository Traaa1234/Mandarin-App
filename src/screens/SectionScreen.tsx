import MnemonicCard from '../components/MnemonicCard';
import { useChar, useIndex } from '../data/useData';
import { pictureChars } from './PictureCardScreen';
import { toneClass } from '../lib/tones';
import { SECTIONS, type SectionId } from '../sections';

export default function SectionScreen({
  id,
  onHome,
  onOpenChar,
}: {
  id: SectionId;
  onHome: () => void;
  onOpenChar: (char: string) => void;
}) {
  const section = SECTIONS.find((s) => s.id === id)!;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onHome}
          aria-label="Home"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <span className={`${section.color} block size-16 rounded-2xl p-2`}>{section.icon}</span>
        <h1 className="han text-3xl font-bold">
          <span className="block text-base font-normal">{section.pinyin}</span>
          {section.han}
        </h1>
      </header>
      {id === 'roots' ? (
        <StageTiles onOpen={onOpenChar} />
      ) : id === 'pictures' ? (
        <PictureTiles onOpen={onOpenChar} />
      ) : (
        <ComingSoon />
      )}
    </main>
  );
}

// Every built character, grouped by stage. The stage map with unlocking comes
// with the game layer; for now every stage is open.
function StageTiles({ onOpen }: { onOpen: (char: string) => void }) {
  const index = useIndex();
  if (!index) return null;

  return (
    <div className="flex flex-col gap-8">
      {index.stages
        .filter((s) => s.chars.length)
        .map((stage) => (
          <section key={stage.id} aria-label={stage.island}>
            <h2 className="mb-3 flex items-center gap-3 text-lg font-bold">
              <span className="flex size-10 items-center justify-center rounded-full bg-[#ffe8a3]">
                {stage.id}
              </span>
              {stage.island}
            </h2>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {stage.chars.map((c) => {
                const entry = index.chars[c];
                return (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => onOpen(c)}
                      aria-label={`${c}, ${entry.gloss}`}
                      className="flex aspect-square w-full flex-col items-center justify-center rounded-2xl bg-white shadow-sm active:scale-95"
                    >
                      <span className={`text-base ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
                      <span className="han text-5xl leading-tight">{c}</span>
                      <span className="text-xs text-ink/50">{entry.gloss}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
    </div>
  );
}

// The picture cards, each tile showing its picture with the character on it.
function PictureTiles({ onOpen }: { onOpen: (char: string) => void }) {
  const index = useIndex();
  if (!index) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {pictureChars(index).map((c) => {
        const entry = index.chars[c];
        return (
          <li key={c}>
            <button
              type="button"
              onClick={() => onOpen(c)}
              aria-label={`${c}, ${entry.gloss}`}
              className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm active:scale-95"
            >
              <PictureThumb char={c} />
              <span className={`text-base ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
              <span className="han -mt-1 text-4xl">{c}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PictureThumb({ char }: { char: string }) {
  const data = useChar(char);
  return <div className="aspect-square w-full">{data && <MnemonicCard data={data} still />}</div>;
}

function ComingSoon() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <span className="han text-8xl" aria-hidden="true">
        🌱
      </span>
      <p className="han text-2xl">
        <span className="block text-base">kuài lái le</span>
        快来了！
      </p>
      <p className="text-sm text-ink/50">Coming soon</p>
    </div>
  );
}
