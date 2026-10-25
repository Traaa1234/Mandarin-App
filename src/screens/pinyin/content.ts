import raw from '../../../content/pinyin.json';

export interface Tile {
  label: string;
  say: string;
}

export interface Practice {
  prompt: string;
  choices: string[];
  answer: string;
  say?: string;
}

export interface Rule {
  id: string;
  title: string;
  explain: string;
  practice: Practice[];
}

export const content = raw as {
  groups: { id: string; title: string; rows: Tile[][] }[];
  toneExample: string;
  rules: Rule[];
};
