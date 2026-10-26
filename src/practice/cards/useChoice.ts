import { useRef, useState } from 'react';
import { boop, buzz, chime } from '../../lib/sfx';
import type { Outcome } from '../rating';

// Shared answer handling: a wrong tap wobbles and allows another try; a second
// wrong tap shows the answer. The outcome goes to the scheduler, so the child
// never grades themselves.
export function useChoice<T>(answer: T, onDone: (o: Outcome) => void) {
  const started = useRef(performance.now());
  const [retries, setRetries] = useState(0);
  const [wobble, setWobble] = useState<T | null>(null);
  const [reveal, setReveal] = useState(false);
  const [finished, setFinished] = useState(false);

  const choose = (choice: T) => {
    if (finished) return;
    const ms = performance.now() - started.current;
    if (choice === answer) {
      setFinished(true);
      chime();
      buzz();
      setTimeout(() => onDone({ retries, helped: false, ms }), 700);
      return;
    }
    boop();
    setWobble(choice);
    setTimeout(() => setWobble(null), 400);
    if (retries >= 1) {
      setFinished(true);
      setReveal(true);
      setTimeout(() => onDone({ retries: retries + 1, helped: true, ms }), 1600);
    }
    setRetries((r) => r + 1);
  };

  return { choose, wobble, reveal, finished };
}

export const shuffle = <T,>(xs: T[]) => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
