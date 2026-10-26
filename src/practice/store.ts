import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type FSRS } from 'ts-fsrs';
import type { DataIndex } from '../data/types';
import { db as defaultDb, MAX_PROFILES, type CardRow, type GardenDb, type Profile } from './db';
import { kindsFor, type Kind } from './kinds';
import { rateOutcome, type FsrsRating, type Outcome } from './rating';

const DAY = 86400000;

export const localDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Review scheduling and storage for one device.
export class Store {
  constructor(
    private readonly db: GardenDb = defaultDb,
    private readonly scheduler: FSRS = fsrs(generatorParameters({ enable_fuzz: true })),
  ) {}

  profiles(): Promise<Profile[]> {
    return this.db.profiles.toArray();
  }

  async addProfile(animal: string, now = new Date()): Promise<number> {
    if ((await this.db.profiles.count()) >= MAX_PROFILES) throw new Error(`At most ${MAX_PROFILES} profiles`);
    return this.db.profiles.add({ animal, createdAt: now });
  }

  cards(profileId: number): Promise<CardRow[]> {
    return this.db.cards.where('profileId').equals(profileId).toArray();
  }

  // A new character starts with its first card, due now.
  async startChar(profileId: number, char: string, index: DataIndex, now = new Date()) {
    const first = kindsFor(index.chars[char])[0];
    await this.db.cards.put({ profileId, char, kind: first, card: createEmptyCard(now) });
    return first;
  }

  // Schedule the next review from what happened. Passing a card for the first
  // time unlocks the character's next card, due tomorrow.
  async answer(
    profileId: number,
    char: string,
    kind: Kind,
    outcome: Outcome,
    index: DataIndex,
    now = new Date(),
  ): Promise<FsrsRating> {
    const rating = rateOutcome(outcome);
    await this.db.transaction('rw', this.db.cards, this.db.reviews, async () => {
      const row = await this.db.cards.get([profileId, char, kind]);
      const card: Card = row?.card ?? createEmptyCard<Card>(now);
      const next = this.scheduler.next(card, now, rating).card;
      await this.db.cards.put({ profileId, char, kind, card: next });
      await this.db.reviews.add({ profileId, char, kind, rating, at: now, ms: outcome.ms, writeMistakes: outcome.writeMistakes });
      if (rating !== Rating.Again) {
        const kinds = kindsFor(index.chars[char]);
        const following = kinds[kinds.indexOf(kind) + 1];
        if (following && !(await this.db.cards.get([profileId, char, following]))) {
          await this.db.cards.put({ profileId, char, kind: following, card: createEmptyCard(new Date(now.getTime() + DAY)) });
        }
      }
    });
    return rating;
  }

  // Characters the child has learned: passing the first card unlocks the
  // second, and every character has at least three, so learned = two or more cards.
  async learned(profileId: number): Promise<Set<string>> {
    const count = new Map<string, number>();
    for (const r of await this.cards(profileId)) count.set(r.char, (count.get(r.char) ?? 0) + 1);
    return new Set([...count].filter(([, n]) => n > 1).map(([c]) => c));
  }

  async addTime(profileId: number, ms: number, now = new Date()) {
    const date = localDate(now);
    const row = await this.db.days.get([profileId, date]);
    await this.db.days.put({ profileId, date, ms: (row?.ms ?? 0) + ms });
  }
}

export const store = new Store();
