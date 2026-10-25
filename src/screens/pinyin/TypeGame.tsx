import { useState } from 'react';
import { playKey, playKeys, useSyllables } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { keyToMarked } from '../../lib/pinyin';

// For older kids: type numbered pinyin (ni3 hao3) and watch it become nǐ hǎo.
// v or ü both work for ü; 5 or no number is the neutral tone.
export default function TypeGame() {
  const syllables = useSyllables();
  const [text, setText] = useState('ni3 hao3');

  const words = text
    .toLowerCase()
    .replace(/ü/g, 'v')
    .split(/[\s,.!?]+/)
    .filter(Boolean)
    .map((w) => {
      const key = /[1-5]$/.test(w) ? w : `${w}5`;
      // A real syllable converts even when this tone has no recording
      // (most neutral-tone recordings don't exist); only recorded ones play.
      const real = [1, 2, 3, 4, 5].some((t) => syllables?.has(`${key.slice(0, -1)}${t}`));
      return { typed: w, key, known: real, playable: !!syllables?.has(key) };
    });

  const playable = words.filter((w) => w.playable).map((w) => w.key);

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm text-ink/60">Type pinyin with tone numbers</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-16 rounded-2xl bg-white px-4 text-3xl shadow-sm outline-none focus:ring-4 focus:ring-[#f59f00]"
        />
      </label>

      <div className="flex min-h-24 flex-wrap items-center justify-center gap-3 rounded-3xl bg-white p-4 shadow-sm" aria-live="polite">
        {words.map((w, i) => (
          <button
            key={i}
            type="button"
            onClick={() => w.playable && playKey(w.key)}
            disabled={!w.playable}
            aria-label={w.known ? keyToMarked(w.key) : `${w.typed}, not a syllable yet`}
            className="min-h-14 rounded-xl px-2 text-5xl font-semibold active:scale-95"
            style={{ color: w.known ? TONE_COLORS[Number(w.key.slice(-1))] : '#ced4da' }}
          >
            {w.known ? keyToMarked(w.key) : w.typed}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => playKeys(playable)}
        disabled={!playable.length}
        aria-label="Play all"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-3xl shadow-md active:scale-95 disabled:opacity-40"
      >
        🔊
      </button>
    </div>
  );
}
