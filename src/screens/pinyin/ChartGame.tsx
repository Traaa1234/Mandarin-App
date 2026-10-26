import { useMemo, useState } from 'react';
import { playKeys, useSyllables } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { keyToMarked, parseKey } from '../../lib/pinyin';

const ROWS = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];
// Finals in teaching order; anything else found in the recordings goes after them.
const FINAL_ORDER = ['a', 'o', 'e', 'i', 'u', 'ü', 'er', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'ueng', 'üe', 'ue', 'üan', 'ün'];

// The full initials × finals grid, built from the recordings: a cell exists only
// where the syllable is real. Tap a cell to hear its tones.
export default function ChartGame() {
  const syllables = useSyllables();
  const [active, setActive] = useState<string | null>(null);

  const chart = useMemo(() => {
    if (!syllables) return null;
    const cells = new Map<string, number[]>();
    for (const key of syllables) {
      const { initial, final, tone } = parseKey(key);
      const id = `${initial}|${final}`;
      cells.set(id, [...(cells.get(id) ?? []), tone].sort());
    }
    const finals = new Set([...cells.keys()].map((id) => id.split('|')[1]));
    const columns = [
      ...FINAL_ORDER.filter((f) => finals.has(f)),
      ...[...finals].filter((f) => !FINAL_ORDER.includes(f)).sort(),
    ];
    return { cells, columns };
  }, [syllables]);

  if (!chart) return null;

  const tonesOf = (id: string) => (chart.cells.get(id) ?? []).filter((t) => t <= 4);
  const keyFor = (id: string, tone: number) => {
    const [initial, final] = id.split('|');
    return `${initial}${final}${tone}`.replace(/ü/g, 'v');
  };

  const press = (id: string) => {
    setActive(id);
    playKeys(tonesOf(id).map((t) => keyFor(id, t)), { gap: 200 });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-16 items-center justify-center gap-4 rounded-2xl bg-white px-3 text-3xl font-semibold shadow-sm" aria-live="polite">
        {active
          ? tonesOf(active).map((t) => (
              <span key={t} style={{ color: TONE_COLORS[t] }}>
                {keyToMarked(keyFor(active, t))}
              </span>
            ))
          : '👆'}
      </div>
      <div className="max-h-[70dvh] overflow-auto rounded-2xl bg-white shadow-sm">
        <table className="border-separate border-spacing-1 text-lg">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 bg-white">
                <span className="sr-only">Initial / final</span>
              </th>
              {chart.columns.map((f) => (
                <th key={f} scope="col" className="sticky top-0 z-10 min-w-14 bg-[#fff9db] px-1 py-2 font-bold">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((initial) => (
              <tr key={initial || 'none'}>
                <th scope="row" className="sticky left-0 z-10 min-w-14 bg-[#fff9db] px-2 font-bold">
                  {initial || '–'}
                </th>
                {chart.columns.map((final) => {
                  const id = `${initial}|${final}`;
                  if (!tonesOf(id).length) return <td key={final} />;
                  const label = `${initial}${final}`;
                  return (
                    <td key={final}>
                      <button
                        type="button"
                        onClick={() => press(id)}
                        aria-label={label}
                        className={`h-14 min-w-14 rounded-xl px-1 transition active:scale-90 ${
                          active === id ? 'bg-[#ffe8a3] ring-2 ring-[#f59f00]' : 'bg-[#f8f4ea]'
                        }`}
                      >
                        {label}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
