import { localDate } from './store';

const DAY = 86400000;

// Monday of the week containing `d`, as YYYY-MM-DD: the id of that week.
export function weekId(d: Date): string {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return localDate(monday);
}

// The friendly dragon visits on Sundays, once a week.
export const dragonAvailable = (now: Date, lastWeekDone: string | null) => now.getDay() === 0 && weekId(now) !== lastWeekDone;

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export { DAY };
