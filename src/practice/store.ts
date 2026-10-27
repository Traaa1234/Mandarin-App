import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type FSRS } from 'ts-fsrs';
import type { DataIndex } from '../data/types';
import { db as defaultDb, MAX_PROFILES, type CardRow, type GardenDb, type Profile } from './db';
import { localDate } from './calendar';
import { flowerState, type Bloom } from './garden';
import { itemKinds } from './items';
import type { Kind } from './kinds';
import { rateOutcome, type FsrsRating, type Outcome } from './rating';

const DAY = 86400000;

export { localDate } from './calendar';

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

  // A new character or word starts with its first card, due now.
  async startChar(profileId: number, char: string, index: DataIndex, now = new Date()) {
    const first = itemKinds(index, char)[0];
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
        const kinds = itemKinds(index, char);
        const following = kinds[kinds.indexOf(kind) + 1];
        if (following && !(await this.db.cards.get([profileId, char, following]))) {
          await this.db.cards.put({ profileId, char, kind: following, card: createEmptyCard(new Date(now.getTime() + DAY)) });
        }
      }
    });
    return rating;
  }

  // Characters and words the child has learned: passing the first card unlocks
  // the second, and every item has at least two, so learned = two or more cards.
  async learned(profileId: number): Promise<Set<string>> {
    const count = new Map<string, number>();
    for (const r of await this.cards(profileId)) count.set(r.char, (count.get(r.char) ?? 0) + 1);
    return new Set([...count].filter(([, n]) => n > 1).map(([c]) => c));
  }

  // Every learned character as a flower, in the order they were learned.
  async garden(profileId: number, now = new Date()): Promise<{ char: string; bloom: Bloom }[]> {
    const [cards, reviews, learned] = await Promise.all([
      this.cards(profileId),
      this.db.reviews.where('profileId').equals(profileId).sortBy('at'),
      this.learned(profileId),
    ]);
    const last = new Map<string, Date>();
    const first = new Map<string, number>();
    for (const r of reviews) {
      last.set(r.char, r.at);
      if (!first.has(r.char)) first.set(r.char, r.at.getTime());
    }
    return [...learned]
      .sort((a, b) => (first.get(a) ?? 0) - (first.get(b) ?? 0))
      .map((char) => ({
        char,
        bloom: flowerState(cards.filter((c) => c.char === char).map((c) => c.card.due), last.get(char) ?? null, now),
      }));
  }

  async getMeta<T>(profileId: number, key: string, fallback: T): Promise<T> {
    return ((await this.db.meta.get([profileId, key]))?.value as T) ?? fallback;
  }

  async setMeta(profileId: number, key: string, value: unknown) {
    await this.db.meta.put({ profileId, key, value });
  }

  async log(profileId: number, type: string, data?: Record<string, unknown>, now = new Date()) {
    await this.db.events.add({ profileId, type, at: now, data });
  }

  events(profileId: number, type: string) {
    return this.db.events.where('[profileId+type]').equals([profileId, type]).toArray();
  }

  // Seeds are earned by playing, never bought.
  seeds(profileId: number): Promise<number> {
    return this.getMeta(profileId, 'seeds', 0);
  }

  async addSeeds(profileId: number, n: number): Promise<number> {
    const total = (await this.seeds(profileId)) + n;
    await this.setMeta(profileId, 'seeds', total);
    return total;
  }

  async owned(profileId: number): Promise<Set<string>> {
    return new Set((await this.db.items.where('profileId').equals(profileId).toArray()).map((r) => r.item));
  }

  async give(profileId: number, item: string, now = new Date()) {
    await this.db.items.put({ profileId, item, at: now });
  }

  // Spend seeds on an item; false when there aren't enough.
  async buy(profileId: number, item: string, price: number, now = new Date()): Promise<boolean> {
    return this.db.transaction('rw', this.db.meta, this.db.items, async () => {
      const have = await this.seeds(profileId);
      if (have < price) return false;
      await this.setMeta(profileId, 'seeds', have - price);
      await this.give(profileId, item, now);
      return true;
    });
  }

  // Days with any practice, as YYYY-MM-DD.
  async practisedDays(profileId: number): Promise<Set<string>> {
    const rows = await this.db.days.where('profileId').equals(profileId).toArray();
    return new Set(rows.filter((r) => r.ms > 0).map((r) => r.date));
  }

  async dayMs(profileId: number, now = new Date()): Promise<number> {
    return (await this.db.days.get([profileId, localDate(now)]))?.ms ?? 0;
  }

  async days(profileId: number) {
    return this.db.days.where('profileId').equals(profileId).sortBy('date');
  }

  reviews(profileId: number) {
    return this.db.reviews.where('profileId').equals(profileId).toArray();
  }

  // For the album: each character's stars, one per kind of card passed at least once.
  async stars(profileId: number): Promise<Map<string, Set<Kind>>> {
    const out = new Map<string, Set<Kind>>();
    for (const r of await this.reviews(profileId)) {
      if (r.rating < 2) continue;
      if (!out.has(r.char)) out.set(r.char, new Set());
      out.get(r.char)!.add(r.kind);
    }
    return out;
  }

  // Everything on this device, for the parent's JSON export.
  async exportAll() {
    const [profiles, cards, reviews, days, meta, events, items] = await Promise.all([
      this.db.profiles.toArray(),
      this.db.cards.toArray(),
      this.db.reviews.toArray(),
      this.db.days.toArray(),
      this.db.meta.toArray(),
      this.db.events.toArray(),
      this.db.items.toArray(),
    ]);
    return { app: 'hanzi-garden', version: 2, exportedAt: new Date().toISOString(), profiles, cards, reviews, days, meta, events, items };
  }

  // Replace everything with an export. Dates come back from JSON as strings.
  async importAll(data: Awaited<ReturnType<Store['exportAll']>>) {
    if (data?.app !== 'hanzi-garden') throw new Error('Not a Hanzi Garden export');
    const date = (v: unknown) => (v ? new Date(v as string) : v);
    const tables = [this.db.profiles, this.db.cards, this.db.reviews, this.db.days, this.db.meta, this.db.events, this.db.items];
    await this.db.transaction('rw', tables, async () => {
      await Promise.all(tables.map((t) => t.clear()));
      await this.db.profiles.bulkPut(data.profiles.map((p) => ({ ...p, createdAt: date(p.createdAt) as Date })));
      await this.db.cards.bulkPut(
        data.cards.map((c) => ({ ...c, card: { ...c.card, due: date(c.card.due) as Date, last_review: date(c.card.last_review) as Date | undefined } })),
      );
      await this.db.reviews.bulkPut(data.reviews.map((r) => ({ ...r, at: date(r.at) as Date })));
      await this.db.days.bulkPut(data.days);
      await this.db.meta.bulkPut(data.meta);
      await this.db.events.bulkPut(data.events.map((e) => ({ ...e, at: date(e.at) as Date })));
      await this.db.items.bulkPut(data.items.map((i) => ({ ...i, at: date(i.at) as Date })));
    });
  }

  // Remove a child and everything they did.
  async deleteProfile(profileId: number) {
    const tables = [this.db.cards, this.db.reviews, this.db.days, this.db.meta, this.db.events, this.db.items];
    await this.db.transaction('rw', [this.db.profiles, ...tables], async () => {
      await this.db.profiles.delete(profileId);
      for (const t of tables) await t.where('profileId').equals(profileId).delete();
    });
  }

  async addTime(profileId: number, ms: number, now = new Date()) {
    const date = localDate(now);
    const row = await this.db.days.get([profileId, date]);
    await this.db.days.put({ profileId, date, ms: (row?.ms ?? 0) + ms });
  }
}

export const store = new Store();
