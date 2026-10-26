// Everything a child can earn. Seeds come only from playing; nothing is ever
// bought with money, and there are no loot boxes or paid currency.

export interface ShopItem {
  id: string;
  kind: 'decor' | 'outfit' | 'background';
  icon: string;
  price: number;
  label: string;
}

export const SHOP: ShopItem[] = [
  { id: 'decor:🍄', kind: 'decor', icon: '🍄', price: 8, label: 'Mushroom' },
  { id: 'decor:🐞', kind: 'decor', icon: '🐞', price: 8, label: 'Ladybird' },
  { id: 'decor:🦋', kind: 'decor', icon: '🦋', price: 10, label: 'Butterfly' },
  { id: 'decor:🐝', kind: 'decor', icon: '🐝', price: 10, label: 'Bee' },
  { id: 'decor:🌻', kind: 'decor', icon: '🌻', price: 12, label: 'Sunflower' },
  { id: 'decor:🐸', kind: 'decor', icon: '🐸', price: 15, label: 'Frog' },
  { id: 'decor:🏮', kind: 'decor', icon: '🏮', price: 20, label: 'Lantern' },
  { id: 'decor:🎏', kind: 'decor', icon: '🎏', price: 20, label: 'Carp kite' },
  { id: 'decor:⛲', kind: 'decor', icon: '⛲', price: 30, label: 'Fountain' },
  { id: 'decor:🌈', kind: 'decor', icon: '🌈', price: 40, label: 'Rainbow' },
  { id: 'outfit:scarf', kind: 'outfit', icon: '🧣', price: 15, label: 'Scarf' },
  { id: 'outfit:bow', kind: 'outfit', icon: '🎀', price: 15, label: 'Bow' },
  { id: 'outfit:glasses', kind: 'outfit', icon: '🕶️', price: 20, label: 'Sunglasses' },
  { id: 'outfit:flowers', kind: 'outfit', icon: '💐', price: 25, label: 'Flower crown' },
  { id: 'background:sunset', kind: 'background', icon: '🌅', price: 30, label: 'Sunset' },
  { id: 'background:night', kind: 'background', icon: '🌌', price: 30, label: 'Night sky' },
  { id: 'background:beach', kind: 'background', icon: '🏖️', price: 30, label: 'Beach' },
];

export const BACKGROUNDS: Record<string, string> = {
  meadow: 'linear-gradient(#dff1ff, #c3e6b4)',
  sunset: 'linear-gradient(#ffd8a8, #ffa8a8)',
  night: 'linear-gradient(#364fc7, #5f3dc4)',
  beach: 'linear-gradient(#a5d8ff, #ffec99)',
};

// Small surprises for the daily gift (free, never tied to money or ads).
export const GIFT_STICKERS = ['🌟', '🍀', '🎈', '🐣', '🍓', '🌞', '🐬', '🪁', '🍉', '🦄'];

// Pick today's gift: a sticker not yet owned, else a shop item not yet owned, else seeds.
export function pickGift(owned: Set<string>, random = Math.random): { item?: string; seeds?: number } {
  const stickers = GIFT_STICKERS.map((s) => `sticker:${s}`).filter((s) => !owned.has(s));
  if (stickers.length) return { item: stickers[Math.floor(random() * stickers.length)] };
  const shop = SHOP.filter((i) => !owned.has(i.id) && i.kind !== 'background');
  if (shop.length) return { item: shop[Math.floor(random() * shop.length)].id };
  return { seeds: 10 };
}

export interface Stats {
  learned: number;
  toneReviews: number;
  daysThisWeek: number;
  fixedTricky: number;
  games: number;
  phrasesSaid: number;
  dragon: boolean;
  taught: number;
  islandsDone: number;
}

export interface Badge {
  id: string;
  icon: string;
  label: string;
  earned: (s: Stats) => boolean;
}

// Badges reward effort and variety, not only accuracy.
export const BADGES: Badge[] = [
  { id: 'first-flower', icon: '🌱', label: 'First flower', earned: (s) => s.learned >= 1 },
  { id: 'ten-flowers', icon: '🌷', label: '10 flowers', earned: (s) => s.learned >= 10 },
  { id: 'tones', icon: '🎵', label: 'Tried 10 tones', earned: (s) => s.toneReviews >= 10 },
  { id: 'three-days', icon: '☀️', label: 'Practised 3 days this week', earned: (s) => s.daysThisWeek >= 3 },
  { id: 'fixed', icon: '🔧', label: 'Fixed a tricky character', earned: (s) => s.fixedTricky >= 1 },
  { id: 'games', icon: '🎮', label: 'Played 5 games', earned: (s) => s.games >= 5 },
  { id: 'speaker', icon: '🗣️', label: 'Said 5 phrases', earned: (s) => s.phrasesSaid >= 5 },
  { id: 'dragon', icon: '🐉', label: "Solved the dragon's riddle", earned: (s) => s.dragon },
  { id: 'teacher', icon: '🧑‍🏫', label: 'Taught Mom or Dad', earned: (s) => s.taught >= 1 },
  { id: 'island', icon: '🏝️', label: 'Finished an island', earned: (s) => s.islandsDone >= 1 },
];

// A tricky character fixed: some card was rated Again and later passed (Good or Easy).
export function fixedTricky(reviews: { char: string; kind: string; rating: number; at: Date }[]): number {
  const failed = new Map<string, number>();
  const fixed = new Set<string>();
  for (const r of [...reviews].sort((a, b) => a.at.getTime() - b.at.getTime())) {
    const key = `${r.char}|${r.kind}`;
    if (r.rating === 1) failed.set(key, r.at.getTime());
    else if (r.rating >= 3 && failed.has(key)) fixed.add(r.char);
  }
  return fixed.size;
}
