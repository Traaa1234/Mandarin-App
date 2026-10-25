import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CharData } from '../data/types';
import { INK } from '../lib/colors';

// The real strokes drawn over the picture, in a bold color, so the shapes match.
const PICTURE_STROKE = '#4a2c17';
const MORPH_SECONDS = 1.5;

// A picture card. The picture is drawn in the character's own coordinates, so its
// strokes line up exactly. The card opens on the picture, then morphs: the picture
// fades away until only the character is left. Tapping plays the morph backward
// (and forward again). Without an approved picture it shows the character alone.
export default function MnemonicCard({
  data,
  size,
  autoPlay = true,
  still = false,
}: {
  data: CharData;
  // Omit to fill the parent's width.
  size?: number;
  autoPlay?: boolean;
  // A thumbnail: the picture with its strokes, no morph, not tappable.
  still?: boolean;
}) {
  const picture = data.mnemonic.picture;
  const [showPicture, setShowPicture] = useState(!!picture);

  useEffect(() => {
    if (!picture || !autoPlay || still) return;
    setShowPicture(true);
    const t = setTimeout(() => setShowPicture(false), 900);
    return () => clearTimeout(t);
  }, [picture, autoPlay, still]);

  const transition = { duration: MORPH_SECONDS, ease: 'easeInOut' } as const;

  const card = (
    // Same frame as the picture files: the 1024 glyph box plus a 112-unit margin.
    <svg
      width={size}
      height={size}
      className={size ? undefined : 'block h-auto w-full'}
      viewBox="-112 -112 1248 1248"
      aria-hidden="true"
    >
      <rect x={-112} y={-112} width={1248} height={1248} rx={140} fill="#fff" />
      {picture && (
        <motion.image
          href={`${import.meta.env.BASE_URL}${picture}`}
          x={-112}
          y={-112}
          width={1248}
          height={1248}
          initial={false}
          animate={{ opacity: showPicture ? 1 : 0 }}
          transition={transition}
        />
      )}
      <g transform="translate(0, 900) scale(1, -1)">
        {data.strokes.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            initial={false}
            animate={{ fill: showPicture ? PICTURE_STROKE : INK }}
            transition={transition}
          />
        ))}
      </g>
    </svg>
  );

  if (!picture || still) {
    return (
      <div role="img" aria-label={data.character} className="overflow-hidden rounded-3xl shadow-md">
        {card}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowPicture((s) => !s)}
      aria-label={showPicture ? `Show the character ${data.character}` : `Show the picture for ${data.character}`}
      aria-pressed={showPicture}
      className="overflow-hidden rounded-3xl shadow-md active:scale-[0.98]"
    >
      {card}
    </button>
  );
}
