import { useState } from 'react';
import ToneShape from '../../components/ToneShape';
import { playKey } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { keyToMarked } from '../../lib/pinyin';
import { content } from './content';

const NAMES = ['', '1st tone', '2nd tone', '3rd tone', '4th tone', 'neutral tone'];

// The four tones and the neutral tone: color, shape, hand motion and sound.
export default function TonesPage() {
  const [runs, setRuns] = useState([0, 0, 0, 0, 0, 0]);

  const press = (tone: number) => {
    setRuns((r) => r.map((n, i) => (i === tone ? n + 1 : n)));
    playKey(`${content.toneExample}${tone}`);
  };

  return (
    <ul className="flex flex-col gap-3">
      {[1, 2, 3, 4, 5].map((tone) => {
        const key = `${content.toneExample}${tone}`;
        return (
          <li key={tone}>
            <button
              type="button"
              onClick={() => press(tone)}
              aria-label={`${NAMES[tone]}: ${keyToMarked(key)}`}
              className="flex w-full items-center gap-4 rounded-3xl bg-white p-3 shadow-sm active:scale-[0.98]"
            >
              <span
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ background: TONE_COLORS[tone] }}
              >
                {tone === 5 ? '·' : tone}
              </span>
              <ToneShape tone={tone} width={120} hand run={runs[tone]} />
              <span className="ml-auto text-5xl font-semibold" style={{ color: TONE_COLORS[tone] }}>
                {keyToMarked(key)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
