import { useEffect, useState } from 'react';
import type { Phrase, PhraseData } from './types';

let promise: Promise<PhraseData> | null = null;

export function usePhrases(): PhraseData | null {
  const [data, setData] = useState<PhraseData | null>(null);
  useEffect(() => {
    let live = true;
    promise ??= fetch(`${import.meta.env.BASE_URL}data/phrases.json`).then((r) => r.json() as Promise<PhraseData>);
    promise.then((d) => live && setData(d), () => {});
    return () => {
      live = false;
    };
  }, []);
  return data;
}

export const allPhrases = (data: PhraseData): (Phrase & { scene: string })[] =>
  data.scenes.flatMap((s) => s.phrases.map((p) => ({ ...p, scene: s.id })));
