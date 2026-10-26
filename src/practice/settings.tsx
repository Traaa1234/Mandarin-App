import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setSfxOptions } from '../lib/sfx';
import { store } from './store';

// Device settings, changed by a parent behind the parent gate.
export interface Settings {
  showPinyin: boolean;
  showEnglish: boolean;
  sounds: boolean;
  haptics: boolean;
  // Play stops for the day after this many minutes; Bǎobao goes to sleep.
  dailyLimitMin: number;
  // Tracing leniency: 1.5 for ages 5–7, 1.0 for older children.
  writing: 'younger' | 'older';
  // HH:MM for the daily reminder, or '' for none.
  reminder: string;
}

export const DEFAULTS: Settings = {
  showPinyin: true,
  showEnglish: true,
  sounds: true,
  haptics: true,
  dailyLimitMin: 20,
  writing: 'younger',
  reminder: '',
};

// Device settings are stored like a child's values, under profile 0.
const DEVICE = 0;

const Ctx = createContext<{ settings: Settings; update: (s: Partial<Settings>) => void }>({ settings: DEFAULTS, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    store.getMeta<Partial<Settings>>(DEVICE, 'settings', {}).then((s) => setSettings({ ...DEFAULTS, ...s }));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute('data-hide-pinyin', !settings.showPinyin);
    root.toggleAttribute('data-hide-english', !settings.showEnglish);
    setSfxOptions({ sounds: settings.sounds, haptics: settings.haptics });
  }, [settings]);

  const update = (s: Partial<Settings>) => {
    const next = { ...settings, ...s };
    setSettings(next);
    store.setMeta(DEVICE, 'settings', next);
  };

  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
export const leniencyFor = (s: Settings) => (s.writing === 'older' ? 1.0 : 1.5);
