import { addDays, localDate, weekId } from './calendar';

// Each week (Monday to Sunday) has 2 automatic rest days.
export const REST_DAYS_PER_WEEK = 2;
// The weekly goal: practise on 4 of the 7 days.
export const WEEKLY_GOAL = 4;

// The Sunshine streak: days practised, counted back from today. A missed day
// uses one of that week's rest days, so missing 1 or 2 days never resets it;
// only a third missed day in the same week ends the streak. Today doesn't count
// against it before the child has played.
export function sunshineStreak(practised: Set<string>, today: Date): number {
  let streak = 0;
  const rests = new Map<string, number>();
  const first = [...practised].sort()[0];
  if (!first) return 0;
  for (let d = today; localDate(d) >= first; d = addDays(d, -1)) {
    const key = localDate(d);
    if (practised.has(key)) {
      streak++;
      continue;
    }
    if (key === localDate(today)) continue;
    const week = weekId(d);
    const used = rests.get(week) ?? 0;
    if (used >= REST_DAYS_PER_WEEK) break;
    rests.set(week, used + 1);
  }
  return streak;
}

// This week's seven suns, Monday first: lit on days practised.
export function weekSuns(practised: Set<string>, today: Date): boolean[] {
  const monday = new Date(weekId(today) + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => practised.has(localDate(addDays(monday, i))));
}
