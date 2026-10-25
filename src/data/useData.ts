import { useEffect, useState } from 'react';
import { loadChar, loadIndex } from './load';
import type { CharData, DataIndex } from './types';

export function useIndex(): DataIndex | null {
  const [index, setIndex] = useState<DataIndex | null>(null);
  useEffect(() => {
    let live = true;
    loadIndex().then((i) => live && setIndex(i), () => {});
    return () => {
      live = false;
    };
  }, []);
  return index;
}

export function useChar(char: string): CharData | null {
  const [data, setData] = useState<CharData | null>(null);
  useEffect(() => {
    let live = true;
    setData(null);
    loadChar(char).then((d) => live && setData(d), () => {});
    return () => {
      live = false;
    };
  }, [char]);
  return data;
}
