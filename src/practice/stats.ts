import type { DataIndex } from '../data/types';
import { weekId } from './calendar';
import { islands } from './garden';
import { fixedTricky, type Stats } from './rewards';
import { store } from './store';

// Everything the badges look at, for one child.
export async function childStats(profileId: number, index: DataIndex, now = new Date()): Promise<Stats> {
  const [learned, reviews, days, games, phrases, owned, taught] = await Promise.all([
    store.learned(profileId),
    store.reviews(profileId),
    store.practisedDays(profileId),
    store.events(profileId, 'game'),
    store.events(profileId, 'speak'),
    store.owned(profileId),
    store.events(profileId, 'teach'),
  ]);
  const week = weekId(now);
  return {
    learned: learned.size,
    toneReviews: reviews.filter((r) => r.kind === 'tone').length,
    daysThisWeek: [...days].filter((d) => weekId(new Date(`${d}T12:00:00`)) === week).length,
    fixedTricky: fixedTricky(reviews),
    games: games.length,
    phrasesSaid: phrases.length,
    dragon: [...owned].some((i) => i.startsWith('sticker:dragon-')),
    taught: taught.length,
    islandsDone: islands(index, learned).filter((i) => i.state === 'done').length,
  };
}
