import type HanziWriter from 'hanzi-writer';
import { useRef, useState } from 'react';
import BigButton from '../../components/BigButton';
import CharWriter from '../../components/CharWriter';
import { useBoxSize } from '../../components/useBoxSize';
import type { CharData } from '../../data/types';
import { strokePinyin } from '../../lib/strokes';

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Panel 1: the stroke-order animation, with play, slow, next stroke and a counter.
export default function WatchPanel({ data }: { data: CharData }) {
  const size = useBoxSize(320);
  const total = data.strokes.length;
  const [slow, setSlow] = useState(false);
  // How many strokes are on screen. Starts full: the character is shown.
  const [shown, setShown] = useState(total);
  const writerRef = useRef<HanziWriter | null>(null);
  // Bumped to cancel a running play-through.
  const run = useRef(0);

  const onWriter = (w: HanziWriter | null) => {
    writerRef.current = w;
    run.current++;
    setShown(total);
  };

  const play = async () => {
    const w = writerRef.current;
    if (!w) return;
    const id = ++run.current;
    await w.hideCharacter();
    setShown(0);
    for (let i = 0; i < total; i++) {
      if (run.current !== id) return;
      await w.animateStroke(i);
      if (run.current !== id) return;
      setShown(i + 1);
      await pause(200);
    }
  };

  const next = async () => {
    const w = writerRef.current;
    if (!w) return;
    const id = ++run.current;
    let i = shown;
    if (shown >= total) {
      await w.hideCharacter();
      i = 0;
    }
    if (run.current !== id) return;
    setShown(i + 1);
    await w.animateStroke(i);
  };

  const name = shown > 0 && shown <= total ? data.strokeNames?.[shown - 1] : undefined;

  return (
    <div className="flex flex-col items-center gap-4">
      <CharWriter
        char={data.character}
        size={size}
        speed={slow ? 0.5 : 1}
        onWriter={onWriter}
        label={`${data.character} stroke order`}
      />
      <div className="flex items-center gap-3">
        <BigButton onClick={play} label="Play">
          ▶️
        </BigButton>
        <BigButton onClick={() => setSlow((s) => !s)} label="Slow" pressed={slow}>
          🐢
        </BigButton>
        <BigButton onClick={next} label="Next stroke">
          ⏭️
        </BigButton>
      </div>
      <div className="flex min-h-16 flex-col items-center" aria-live="polite">
        <span className="text-2xl font-bold tabular-nums">
          {shown} / {total}
        </span>
        {name && (
          <span className="han text-xl">
            {name} <span className="text-base text-ink/60">{strokePinyin(name)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
