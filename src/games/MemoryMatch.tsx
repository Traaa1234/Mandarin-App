import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { boop, buzz, chime } from '../lib/sfx';
import { toneClass } from '../lib/tones';
import { shuffle } from '../practice/cards/useChoice';
import type { GameProps } from './types';

type Card = { id: number; pair: string; face: 'char' | 'picture' | 'pinyin' };

// Memory Match: flip cards to pair each picture with its character. Before
// three pictured characters are learned, characters pair with their pinyin.
export default function MemoryMatch({ index, learned, onDone }: GameProps) {
  const base = import.meta.env.BASE_URL;
  const cards = useMemo(() => {
    const pictured = learned.filter((c) => index.chars[c].picture);
    const usePictures = pictured.length >= 3;
    const pairs = shuffle(usePictures ? pictured : learned).slice(0, learned.length >= 8 ? 4 : 3);
    return shuffle(pairs.flatMap((p): Card[] => [{ id: 0, pair: p, face: 'char' }, { id: 0, pair: p, face: usePictures ? 'picture' : 'pinyin' }])).map((c, i) => ({ ...c, id: i }));
  }, [learned, index]);
  const [up, setUp] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [misses, setMisses] = useState(0);

  const flip = (card: Card) => {
    if (up.length === 2 || up.includes(card.id) || found.has(card.pair)) return;
    const next = [...up, card.id];
    setUp(next);
    if (next.length < 2) return;
    const [a, b] = next.map((id) => cards[id]);
    if (a.pair === b.pair) {
      chime();
      buzz();
      const done = new Set(found).add(a.pair);
      setFound(done);
      setUp([]);
      const pairs = cards.length / 2;
      if (done.size === pairs) setTimeout(() => onDone(Math.max(0, pairs - Math.max(0, misses - pairs)), pairs), 700);
    } else {
      boop();
      setMisses((m) => m + 1);
      setTimeout(() => setUp([]), 900);
    }
  };

  return (
    <div className={`grid gap-3 ${cards.length > 6 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {cards.map((card) => {
        const shown = up.includes(card.id) || found.has(card.pair);
        const entry = index.chars[card.pair];
        return (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => flip(card)}
            aria-label={shown ? `${card.face} ${card.pair}` : 'Hidden card'}
            animate={{ rotateY: shown ? 0 : 180 }}
            className={`flex aspect-square items-center justify-center rounded-2xl shadow-md ${shown ? (found.has(card.pair) ? 'bg-[#c3e6b4]' : 'bg-white') : 'bg-[#f59f00]'}`}
          >
            {shown ? (
              card.face === 'char' ? (
                <span className="han text-5xl">{card.pair}</span>
              ) : card.face === 'picture' ? (
                <img src={`${base}${entry.picture}`} alt="" className="size-full rounded-2xl p-1" />
              ) : (
                <span className={`text-2xl font-semibold py ${toneClass(entry.pinyin)}`}>{entry.pinyin}</span>
              )
            ) : (
              <span className="text-4xl text-white">?</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
