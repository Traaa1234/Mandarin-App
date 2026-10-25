import HanziWriter from 'hanzi-writer';
import { motion } from 'framer-motion';
import { Fragment, useState } from 'react';
import BigButton from '../../components/BigButton';
import StrokeSvg from '../../components/StrokeSvg';
import TianGrid from '../../components/TianGrid';
import { useBoxSize } from '../../components/useBoxSize';
import type { CharData, DataIndex } from '../../data/types';
import { INK, partColor } from '../../lib/colors';
import { speak } from '../../lib/speech';
import { toneClass } from '../../lib/tones';
import PartChip from './PartChip';
import { partView } from './parts';

// Center of the glyph box in the source data's coordinates (y runs from -124 to 900).
const CENTER = { x: 512, y: 388 };

// Panel 4: the parts slide in from separate boxes and join, then the meaning card.
export default function TogetherPanel({
  data,
  index,
  onOpen,
}: {
  data: CharData;
  index: DataIndex;
  onOpen: (char: string) => void;
}) {
  const size = useBoxSize(280);
  const [round, setRound] = useState(0);
  const view = partView(data);

  if (!view) return <RootCard data={data} index={index} onOpen={onOpen} size={size} />;

  const { x: tx, y, scale, transform } = HanziWriter.getScalingTransform(size, size, size * 0.06);
  // The transform is translate(x, size - y) scale(scale, -scale).
  const ty = size - y;
  const toScreen = (px: number, py: number) => ({ x: tx + px * scale, y: ty - py * scale });

  const groups = view.leaves.map((_, leaf) => {
    const strokes = view.strokeLeaf.flatMap((l, i) => (l === leaf ? [i] : []));
    const points = strokes.flatMap((i) => data.medians[i]);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    // Start each part pushed outward from the center, in its own box, far
    // enough to leave a clear gap but still inside the grid.
    const dirX = (cx - CENTER.x) * scale;
    const dirY = -(cy - CENTER.y) * scale;
    const len = Math.hypot(dirX, dirY) || 1;
    const dx = (dirX / len) * size * 0.1;
    const dy = (dirY / len) * size * 0.1;
    const pad = 40;
    const tl = toScreen(Math.min(...xs) - pad, Math.max(...ys) + pad);
    const br = toScreen(Math.max(...xs) + pad, Math.min(...ys) - pad);
    return { strokes, dx, dy, box: { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y } };
  });

  const etym = data.etymology;
  const pictophonetic = etym?.type === 'pictophonetic';
  const tagFor = (char: string) =>
    pictophonetic ? (char === etym?.semantic ? '💡 meaning' : char === etym?.phonetic ? '🔊 sound' : undefined) : undefined;

  const replay = () => {
    setRound((r) => r + 1);
    if (pictophonetic && etym?.semantic && etym.phonetic) {
      // Play the meaning helper and the sound helper, then the whole character.
      setTimeout(() => speak(`${etym.semantic}，${etym.phonetic}，${data.character}`), 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`The parts of ${data.character} joining together`}
      >
        <TianGrid size={size} />
        {groups.map((g, leaf) => (
          <motion.g
            key={`${round}-${leaf}`}
            initial={{ x: g.dx, y: g.dy, scale: 0.8 }}
            animate={{ x: 0, y: 0, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 90, damping: 14 }}
          >
            <motion.rect
              x={g.box.x}
              y={g.box.y}
              width={g.box.w}
              height={g.box.h}
              rx={10}
              fill="#fff"
              stroke={partColor(leaf)}
              strokeWidth={2}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            />
            <g transform={transform}>
              {g.strokes.map((i) => (
                <motion.path
                  key={i}
                  d={data.strokes[i]}
                  initial={{ fill: partColor(leaf) }}
                  animate={{ fill: INK }}
                  transition={{ delay: 1.8, duration: 0.6 }}
                />
              ))}
            </g>
          </motion.g>
        ))}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-2 text-3xl">
        {view.leaves.map((leaf, i) => (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true">+</span>}
            <PartChip char={leaf.char} color={partColor(i)} index={index} onOpen={onOpen} tag={tagFor(leaf.char)} />
          </Fragment>
        ))}
        <span aria-hidden="true">=</span>
        <div className="flex min-h-16 min-w-20 flex-col items-center rounded-2xl bg-[#ffe8a3] px-3 py-2 shadow-sm">
          <span className={`text-sm ${toneClass(data.pinyin)}`}>{data.pinyin}</span>
          <span className="han text-4xl leading-tight">{data.character}</span>
          <span className="text-xs text-ink/60">{data.gloss}</span>
        </div>
      </div>

      <BigButton onClick={replay} label="Put it together again">
        🔁
      </BigButton>
      {etym?.hint && <p className="max-w-sm text-center text-sm text-ink/50">{etym.hint}</p>}
    </div>
  );
}

// Roots and costumes have no parts to join. A pictograph shows where it came from;
// the picture itself arrives with the Picture Cards milestone.
function RootCard({
  data,
  index,
  onOpen,
  size,
}: {
  data: CharData;
  index: DataIndex;
  onOpen: (char: string) => void;
  size: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <StrokeSvg strokes={data.strokes} colors={data.strokes.map(() => INK)} size={size} />
      {data.role === 'costume' && data.costumeOf && (
        <div className="flex items-center gap-3 text-3xl">
          <PartChip char={data.costumeOf} index={index} onOpen={onOpen} />
          <span aria-hidden="true">→</span>
          <PartChip char={data.character} index={index} onOpen={onOpen} />
        </div>
      )}
      {data.etymology?.hint && <p className="max-w-sm text-sm text-ink/50">{data.etymology.hint}</p>}
    </div>
  );
}
