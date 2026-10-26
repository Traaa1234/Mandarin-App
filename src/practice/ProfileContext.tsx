import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from './db';
import { store } from './store';

interface ProfileState {
  profiles: Profile[] | null;
  current: Profile | null;
  choose: (id: number | null) => void;
  add: (animal: string) => Promise<void>;
}

const Ctx = createContext<ProfileState>({ profiles: null, current: null, choose: () => {}, add: async () => {} });

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
  return <Ctx.Provider value={{ profiles, current, choose, add }}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
