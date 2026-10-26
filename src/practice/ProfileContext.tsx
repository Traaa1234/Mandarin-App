import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from './db';
import { store } from './store';

interface ProfileState {
  profiles: Profile[] | null;
  current: Profile | null;
  choose: (id: number | null) => void;
  add: (animal: string) => Promise<void>;
  // What Bǎobao wears for this child, and the garden's background.
  outfit: string | null;
  background: string;
  dress: (outfit: string | null) => void;
  paint: (background: string) => void;
  reload: () => Promise<void>;
}

const Ctx = createContext<ProfileState>({
  profiles: null,
  current: null,
  choose: () => {},
  add: async () => {},
  outfit: null,
  background: 'meadow',
  dress: () => {},
  paint: () => {},
  reload: async () => {},
});

// Which child is playing is a per-device convenience, so it lives in localStorage;
// the progress itself is in IndexedDB.
const KEY = 'hanzi-garden:profile';
const remembered = () => {
  try {
    return Number(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(remembered);

  const reload = useCallback(async () => setProfiles(await store.profiles()), []);
  useEffect(() => {
    reload();
  }, [reload]);

  const choose = (id: number | null) => {
    setCurrentId(id);
    try {
      if (id) localStorage.setItem(KEY, String(id));
      else localStorage.removeItem(KEY);
    } catch {
      // Private mode: the choice just isn't remembered.
    }
  };

  const add = async (animal: string) => {
    const id = await store.addProfile(animal);
    await reload();
    choose(id);
  };

  const current = profiles?.find((p) => p.id === currentId) ?? null;
  const [outfit, setOutfit] = useState<string | null>(null);
  const [background, setBackground] = useState('meadow');

  useEffect(() => {
    if (!current) return;
    store.getMeta<string | null>(current.id!, 'outfit', null).then(setOutfit);
    store.getMeta(current.id!, 'background', 'meadow').then(setBackground);
  }, [current]);

  const dress = (o: string | null) => {
    setOutfit(o);
    if (current) store.setMeta(current.id!, 'outfit', o);
  };
  const paint = (b: string) => {
    setBackground(b);
    if (current) store.setMeta(current.id!, 'background', b);
  };

  return (
    <Ctx.Provider value={{ profiles, current, choose, add, outfit, background, dress, paint, reload }}>{children}</Ctx.Provider>
  );
}

export const useProfile = () => useContext(Ctx);
