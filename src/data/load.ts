import type { CharDataLoaderFn } from 'hanzi-writer';
import { charFile, type CharData, type DataIndex } from './types';

const base = `${import.meta.env.BASE_URL}data/`;

let indexPromise: Promise<DataIndex> | null = null;
const charPromises = new Map<string, Promise<CharData>>();

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(base + path);
  if (!res.ok) throw new Error(`Could not load ${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function loadIndex(): Promise<DataIndex> {
  indexPromise ??= getJson<DataIndex>('index.json');
  return indexPromise;
}

export function loadChar(char: string): Promise<CharData> {
  let p = charPromises.get(char);
  if (!p) {
    p = getJson<CharData>(`chars/${charFile(char)}`);
    p.catch(() => charPromises.delete(char));
    charPromises.set(char, p);
  }
  return p;
}

// Hanzi Writer reads stroke data from our bundled files instead of its CDN, so
// the app works offline. The files carry strokes, medians and radStrokes.
export const charDataLoader: CharDataLoaderFn = (char, onLoad, onError) => {
  loadChar(char).then(onLoad, onError);
};
