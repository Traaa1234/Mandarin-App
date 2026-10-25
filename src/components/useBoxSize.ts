import { useEffect, useState } from 'react';

// The largest square that fits the screen width (with 16 px gutters), capped at max.
export function useBoxSize(max: number): number {
  const calc = () => Math.min(max, Math.floor(window.innerWidth - 32));
  const [size, setSize] = useState(calc);
  useEffect(() => {
    const onResize = () => setSize(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });
  return size;
}
