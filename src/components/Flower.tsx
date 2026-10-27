import { motion } from 'framer-motion';
import type { Bloom } from '../practice/garden';

const PETALS = ['#ff8fa3', '#ffa94d', '#da77f2', '#74c0fc', '#ffd43b', '#ff6b6b', '#63e6be'];

// A learned character's flower. Petal color comes from the character, so each
// flower keeps its own color. Sleepy flowers droop and close; blooming ones
// open wide and sparkle. None ever wilt. A word's flower holds the whole word.
export default function Flower({ char, bloom, size = 96 }: { char: string; bloom: Bloom; size?: number }) {
  const petal = PETALS[char.codePointAt(0)! % PETALS.length];
  const open = bloom === 'sleepy' ? 0.75 : bloom === 'open' ? 0.88 : 1;
  const tilt = bloom === 'sleepy' ? 18 : 0;
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 100 125" role="img" aria-label={`${char} flower, ${bloom}`}>
      <path d="M50 120 Q48 90 50 62" stroke="#5fae58" strokeWidth="5" fill="none" />
      <path d="M50 96 Q34 84 28 92 Q38 102 50 98 Z" fill="#8ccf7e" />
      <path d="M50 88 Q66 76 72 84 Q62 94 50 90 Z" fill="#8ccf7e" />
      <motion.g
        style={{ originX: '50px', originY: '62px' }}
        initial={false}
        animate={{ rotate: tilt, scale: open, opacity: bloom === 'sleepy' ? 0.7 : 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 10 }}
      >
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="50" cy="22" rx="13" ry="20" fill={petal} transform={`rotate(${a} 50 42)`} />
        ))}
        <circle cx="50" cy="42" r="15" fill="#fff9db" stroke="#f2c46d" strokeWidth="2" />
        <text x="50" y={char.length > 1 ? 47 : 49} textAnchor="middle" fontSize={char.length > 1 ? 13 : 20} lang="zh-Hans" className="han" fill="#2b2b2b">
          {char}
        </text>
      </motion.g>
      {bloom === 'sleepy' && (
        <text x="74" y="18" fontSize="14" fill="#868e96">
          z
        </text>
      )}
      {bloom === 'bloom' && (
        <motion.text x="80" y="16" fontSize="16" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          ✨
        </motion.text>
      )}
    </svg>
  );
}
