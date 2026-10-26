import StrokeSvg from '../../components/StrokeSvg';
import type { CharData } from '../../data/types';
import { INK, NEW_STROKE } from '../../lib/colors';
import { speak } from '../../lib/speech';
import { strokePinyin } from '../../lib/strokes';

// Panel 2: stroke fanning. One box per stroke, each adding the next one in color.
export default function StrokesPanel({ data }: { data: CharData }) {
  return (
    <ol className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {data.strokes.map((_, i) => {
        const name = data.strokeNames?.[i];
        const colors = data.strokes.map((__, j) => (j < i ? INK : j === i ? NEW_STROKE : null));
        return (
          <li key={i}>
            <button
              type="button"
              onClick={() => name && speak(name)}
              aria-label={name ? `Stroke ${i + 1}: ${name}` : `Stroke ${i + 1}`}
              className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-2 shadow-sm active:scale-95"
            >
              <StrokeSvg strokes={data.strokes} colors={colors} size={88} />
              <span className="text-sm text-ink/70 tabular-nums">{i + 1}</span>
              {name && (
                <>
                  <span className="text-xs leading-none">{strokePinyin(name)}</span>
                  <span lang="zh-Hans" className="han text-lg leading-tight">{name}</span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
