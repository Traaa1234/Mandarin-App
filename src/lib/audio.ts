import { useEffect, useState } from 'react';

// Native syllable recordings from audio-cmn (speaker: Chen Wang, CC BY-SA),
// bundled in public/audio/syllables/.
const base = `${import.meta.env.BASE_URL}`;

let listPromise: Promise<Set<string>> | null = null;

export function loadSyllables(): Promise<Set<string>> {
  listPromise ??= fetch(`${base}data/syllables.json`)
    .then((r) => r.json() as Promise<string[]>)
    .then((keys) => new Set(keys));
  return listPromise;
}

export function useSyllables(): Set<string> | null {
  const [set, setSet] = useState<Set<string> | null>(null);
  useEffect(() => {
    let live = true;
    loadSyllables().then((s) => live && setSet(s), () => {});
    return () => {
      live = false;
    };
  }, []);
  return set;
}

let current: HTMLAudioElement | null = null;
// Bumped to cancel a running sequence when something new plays.
let sequence = 0;

function playPath(path: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    current?.pause();
    const audio = new Audio(`${base}${path}`);
    audio.playbackRate = rate;
    current = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

// Play recordings one after another, e.g. ['ni2', 'hao3'] or the four tones of a syllable.
export async function playKeys(keys: string[], { rate = 1, gap = 120 } = {}) {
  const id = ++sequence;
  for (const key of keys) {
    if (id !== sequence) return;
    await playPath(`audio/syllables/${key}.mp3`, rate);
    if (gap) await new Promise((r) => setTimeout(r, gap));
  }
}

export const playKey = (key: string, rate = 1) => playKeys([key], { rate, gap: 0 });

// Play a bundled file such as audio/phrases/ni-hao.mp3. A rate below 1 slows it
// down without lowering the pitch (browsers keep pitch by default).
export function playFile(path: string, rate = 1): Promise<void> {
  ++sequence;
  return playPath(path, rate);
}
