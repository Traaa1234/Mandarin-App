import { useState } from 'react';
import SpeakButton from '../../components/SpeakButton';
import { useChar, useIndex } from '../../data/useData';
import { toneClass } from '../../lib/tones';
import ApartPanel from './ApartPanel';
import FamilyPanel from './FamilyPanel';
import StrokesPanel from './StrokesPanel';
import TogetherPanel from './TogetherPanel';
import WatchPanel from './WatchPanel';

// The five panels, in the order the spec gives them. One panel per screen.
const PANELS = [
  { id: 'watch', icon: '👀', label: 'Watch it' },
  { id: 'strokes', icon: '✏️', label: 'Stroke by stroke' },
  { id: 'apart', icon: '✂️', label: 'Take it apart' },
  { id: 'together', icon: '🧩', label: 'Put it together' },
  { id: 'family', icon: '🌳', label: 'Family' },
] as const;

export default function CharacterScreen({
  char,
  onBack,
  onOpen,
}: {
  char: string;
  onBack: () => void;
  onOpen: (char: string) => void;
}) {
  const index = useIndex();
  const data = useChar(char);
  const [panel, setPanel] = useState(0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
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
              <span className={`text-lg ${toneClass(data.pinyin)}`}>{data.pinyin}</span>
              <h1 className="han text-5xl">{char}</h1>
            </div>
            <span className="text-ink/60">{data.gloss}</span>
            <span className="ml-auto">
              <SpeakButton text={char} />
            </span>
          </>
        )}
      </header>

      <nav className="mb-5 grid grid-cols-5 gap-2" aria-label="Panels">
        {PANELS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPanel(i)}
            aria-label={p.label}
            aria-current={panel === i ? 'step' : undefined}
            className={`flex h-16 items-center justify-center rounded-2xl text-3xl shadow-sm transition active:scale-95 ${
              panel === i ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : 'bg-white'
            }`}
          >
            {p.icon}
          </button>
        ))}
      </nav>

      {data && index && (
        <section aria-label={PANELS[panel].label} className="flex-1">
          {panel === 0 && <WatchPanel data={data} />}
          {panel === 1 && <StrokesPanel data={data} />}
          {panel === 2 && <ApartPanel data={data} index={index} onOpen={onOpen} />}
          {panel === 3 && <TogetherPanel data={data} index={index} onOpen={onOpen} />}
          {panel === 4 && <FamilyPanel data={data} index={index} onOpen={onOpen} />}
        </section>
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setPanel((p) => Math.max(0, p - 1))}
          disabled={panel === 0}
          aria-label="Previous panel"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => setPanel((p) => Math.min(PANELS.length - 1, p + 1))}
          disabled={panel === PANELS.length - 1}
          aria-label="Next panel"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </main>
  );
}
