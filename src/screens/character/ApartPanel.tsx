import StrokeSvg from '../../components/StrokeSvg';
import { useBoxSize } from '../../components/useBoxSize';
import type { CharData, DataIndex } from '../../data/types';
import { INK, partColor } from '../../lib/colors';
import PartChip from './PartChip';
import { partView } from './parts';

// Panel 3: the character split into its parts, each part's strokes in its own
// color (from the stroke-to-part matches). Tapping a part opens its screen.
export default function ApartPanel({
  data,
  index,
  onOpen,
}: {
  data: CharData;
  index: DataIndex;
  onOpen: (char: string) => void;
}) {
  const size = useBoxSize(280);
  const view = partView(data);

  if (!view) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <StrokeSvg strokes={data.strokes} colors={data.strokes.map(() => INK)} size={size} />
        {data.role === 'costume' && data.costumeOf ? (
          <div className="flex items-center gap-3 text-3xl">
            <PartChip char={data.costumeOf} index={index} onOpen={onOpen} />
            <span aria-hidden="true">→</span>
            <PartChip char={data.character} index={index} onOpen={onOpen} />
          </div>
        ) : (
          <p lang="zh-Hans" className="han text-2xl">
            <span className="block text-base">gēn 🌱</span>根
          </p>
        )}
        <p className="text-sm text-ink/70">
          {data.role === 'costume'
            ? `${data.character} is ${data.costumeOf} in costume. It can't be split.`
            : `${data.character} is a root. It can't be split.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <StrokeSvg
        strokes={data.strokes}
        colors={view.colors}
        size={size}
        label={`${data.character} with each part in its own color`}
      />
      <div className="flex flex-wrap justify-center gap-3">
        {view.leaves.map((leaf, i) => (
          <PartChip key={i} char={leaf.char} color={partColor(i)} index={index} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
