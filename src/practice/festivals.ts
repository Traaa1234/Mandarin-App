import raw from '../../content/festivals.json';

export interface Festival {
  id: string;
  name: string;
  han: string;
  pinyin: string;
  icon: string;
  chars: string[];
  dates: string[];
}

const content = raw as { daysAround: number; festivals: Festival[] };
const DAY = 86400000;

// The festival whose date is within a week of today, if any.
export function activeFestival(now: Date, list = content.festivals, around = content.daysAround): Festival | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return (
    list.find((f) =>
      f.dates.some((d) => {
        const at = new Date(`${d}T00:00:00`).getTime();
        return Math.abs(at - today) <= around * DAY;
      }),
    ) ?? null
  );
}
