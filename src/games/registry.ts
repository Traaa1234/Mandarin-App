import { lazy, type ComponentType } from 'react';
import type { DataIndex } from '../data/types';
import type { GameProps } from './types';

export interface GameInfo {
  id: string;
  icon: string;
  han: string;
  pinyin: string;
  english: string;
  skill: string;
  // Can this game be played with what the child has learned?
  ready: (learned: string[], index: DataIndex) => boolean;
  component: ComponentType<GameProps>;
}

const compounds = (learned: string[], index: DataIndex) => learned.filter((c) => index.chars[c].role === 'compound');
const pictured = (learned: string[], index: DataIndex) => learned.filter((c) => index.chars[c].picture);

// The nine mini-games. Each takes 60–90 seconds and uses only learned characters.
// (The Weekly Dragon Riddle comes up on Sundays.)
export const GAMES: GameInfo[] = [
  { id: 'catch', icon: '🎈', han: '接气球', pinyin: 'jiē qìqiú', english: 'Character Catch', skill: 'Listening, recognition', ready: (l) => l.length >= 3, component: lazy(() => import('./CharacterCatchGame')) },
  { id: 'rescue', icon: '🧩', han: '救字根', pinyin: 'jiù zìgēn', english: 'Root Rescue', skill: 'Taking characters apart', ready: (l, i) => compounds(l, i).length >= 1, component: lazy(() => import('./RootRescue')) },
  { id: 'bowl', icon: '🥣', han: '拌一拌', pinyin: 'bàn yi bàn', english: 'Mixing Bowl', skill: 'Meaning combos', ready: (l) => l.length >= 4, component: lazy(() => import('./MixingBowl')) },
  { id: 'surf', icon: '🏄', han: '冲浪', pinyin: 'chōnglàng', english: 'Tone Surfer', skill: 'Tones', ready: (l) => l.length >= 2, component: lazy(() => import('./ToneSurfer')) },
  { id: 'memory', icon: '🃏', han: '翻一翻', pinyin: 'fān yi fān', english: 'Memory Match', skill: 'Picture memory', ready: (l, i) => pictured(l, i).length >= 3 || l.length >= 3, component: lazy(() => import('./MemoryMatch')) },
  { id: 'race', icon: '🏁', han: '写字赛跑', pinyin: 'xiězì sàipǎo', english: 'Stroke Race', skill: 'Writing, stroke order', ready: (l) => l.length >= 1, component: lazy(() => import('./StrokeRace')) },
  { id: 'train', icon: '🚂', han: '拼音火车', pinyin: 'pīnyīn huǒchē', english: 'Pinyin Train', skill: 'Pinyin', ready: (l) => l.length >= 2, component: lazy(() => import('./PinyinTrain')) },
  { id: 'hidden', icon: '🔍', han: '找一找', pinyin: 'zhǎo yi zhǎo', english: 'Hidden Hanzi', skill: 'Spotting roots', ready: (l) => l.length >= 3, component: lazy(() => import('./HiddenHanzi')) },
];

export const DRAGON: GameInfo = {
  id: 'dragon',
  icon: '🐉',
  han: '龙的谜语',
  pinyin: 'lóng de míyǔ',
  english: 'Weekly Dragon Riddle',
  skill: 'Weekly review',
  ready: (l) => l.length >= 3,
  component: lazy(() => import('./DragonRiddle')),
};

// One game a day for the adventure, taking turns among the playable ones.
export function gameOfTheDay(learned: string[], index: DataIndex, day = Math.floor(Date.now() / 86400000)): GameInfo | null {
  const playable = GAMES.filter((g) => g.ready(learned, index));
  return playable.length ? playable[day % playable.length] : null;
}
