import { useEffect, useState, type ReactNode } from 'react';
import Baobao, { Speech } from '../components/Baobao';
import { useProfile } from './ProfileContext';
import ParentGate from './ParentGate';
import { useSettings } from './settings';
import { localDate, store } from './store';

const TICK = 15000;
const EXTRA_MIN = 10;

// Counts play time while a child is playing and the app is visible, and stops
// play for the day once the parent's daily limit is reached: Bǎobao goes to
// sleep. Only a grown-up can add a little more time.
export default function PlayTime({ children }: { children: ReactNode }) {
  const { current } = useProfile();
  const { settings } = useSettings();
  const [asleep, setAsleep] = useState(false);
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (!current) return;
    const id = current.id!;
    const check = async () => {
      const extra = await store.getMeta(id, `extra:${localDate(new Date())}`, 0);
      setAsleep((await store.dayMs(id)) >= (settings.dailyLimitMin + extra) * 60000);
    };
    check();
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      await store.addTime(id, TICK);
      await check();
    }, TICK);
    return () => clearInterval(timer);
  }, [current, settings.dailyLimitMin]);

  if (!asleep) return <>{children}</>;

  const more = async () => {
    const key = `extra:${localDate(new Date())}`;
    await store.setMeta(current!.id!, key, (await store.getMeta(current!.id!, key, 0)) + EXTRA_MIN);
    setGate(false);
    setAsleep(false);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-5 px-4 py-6">
      {gate ? (
        <ParentGate onPass={more} onCancel={() => setGate(false)} />
      ) : (
        <>
          <Baobao mood="sleep" size={180} />
          <Speech han="明天见！" pinyin="míngtiān jiàn" english="Bǎobao is sleeping. See you tomorrow!" />
          <button type="button" onClick={() => setGate(true)} className="mt-6 min-h-14 rounded-2xl px-4 text-sm text-ink/50 underline">
            Grown-ups: {EXTRA_MIN} more minutes
          </button>
        </>
      )}
    </main>
  );
}
