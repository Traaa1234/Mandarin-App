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

export class GardenDb extends Dexie {
  profiles!: Table<Profile, number>;
  cards!: Table<CardRow, [number, string, Kind]>;
  reviews!: Table<ReviewRow, number>;
  days!: Table<DayRow, [number, string]>;

  constructor(name = 'hanzi-garden') {
    super(name);
    this.version(1).stores({
      profiles: '++id',
      cards: '[profileId+char+kind], profileId',
      reviews: '++id, profileId, [profileId+at]',
      days: '[profileId+date], profileId',
    });
  }
}

export const db = new GardenDb();
