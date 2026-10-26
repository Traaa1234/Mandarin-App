import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const COLORS = ['#ff8fa3', '#ffd43b', '#74c0fc', '#8ccf7e', '#da77f2', '#ffa94d'];

// A short confetti burst on every right answer, a bigger one when a session ends.
// Listens for the 'hg:celebrate' event from lib/sfx.
export default function Confetti() {
  const [bursts, setBursts] = useState<{ id: number; big: boolean }[]>([]);

  useEffect(() => {
    const on = (e: Event) => {
      const id = Date.now() + Math.random();
      setBursts((b) => [...b, { id, big: !!(e as CustomEvent).detail?.big }]);
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1600);
    };
    window.addEventListener('hg:celebrate', on);
    return () => window.removeEventListener('hg:celebrate', on);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {bursts.flatMap((b) =>
          Array.from({ length: b.big ? 60 : 18 }, (_, i) => {
            const angle = (i / (b.big ? 60 : 18)) * Math.PI * 2;
            const dist = (b.big ? 260 : 140) * (0.6 + Math.random() * 0.4);
            return (
              <motion.span
                key={`${b.id}-${i}`}
                className="absolute top-1/2 left-1/2 size-3 rounded-sm"
                style={{ background: COLORS[i % COLORS.length] }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 120, opacity: 0, rotate: 360 }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              />
            );
          }),
        )}
      </AnimatePresence>
    </div>
  );
}
