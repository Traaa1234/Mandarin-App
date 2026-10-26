import Dexie, { type Table } from 'dexie';
import type { Card } from 'ts-fsrs';
import type { Kind } from './kinds';

// Everything a child does is stored on this device only, in IndexedDB.

export const MAX_PROFILES = 4;

// A child is known only by an animal avatar: no names or ages.
export interface Profile {
  id?: number;
  animal: string;
  createdAt: Date;
}

export interface CardRow {
  profileId: number;
  char: string;
  kind: Kind;
  card: Card;
}

export interface ReviewRow {
  id?: number;
  profileId: number;
  char: string;
  kind: Kind;
  rating: number;
  at: Date;
  ms: number;
  writeMistakes?: number;
}

// Practice time per day, for the streak and the parent area.
export interface DayRow {
  profileId: number;
  date: string;
  ms: number;
}

// Small per-child values: seeds, best times, the chosen outfit, last bonus game…
export interface MetaRow {
  profileId: number;
  key: string;
  value: unknown;
}

// Things that happened, for badges and the parent area: a game played, a phrase said, a gift opened.
export interface EventRow {
  id?: number;
  profileId: number;
  type: string;
  at: Date;
  data?: Record<string, unknown>;
}

// Rewards bought with seeds or given as gifts: decorations, outfits, backgrounds, stickers.
export interface ItemRow {
  profileId: number;
  item: string;
  at: Date;
}

export class GardenDb extends Dexie {
  profiles!: Table<Profile, number>;
  cards!: Table<CardRow, [number, string, Kind]>;
  reviews!: Table<ReviewRow, number>;
  days!: Table<DayRow, [number, string]>;
  meta!: Table<MetaRow, [number, string]>;
  events!: Table<EventRow, number>;
  items!: Table<ItemRow, [number, string]>;

  constructor(name = 'hanzi-garden') {
    super(name);
    this.version(1).stores({
      profiles: '++id',
      cards: '[profileId+char+kind], profileId',
      reviews: '++id, profileId, [profileId+at]',
      days: '[profileId+date], profileId',
    });
    // Version 2 adds the game layer's tables; existing progress is kept.
    this.version(2).stores({
      meta: '[profileId+key], profileId',
      events: '++id, profileId, [profileId+type]',
      items: '[profileId+item], profileId',
    });
  }
}

export const db = new GardenDb();
