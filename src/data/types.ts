// Shapes of the files that scripts/build-data.ts writes to public/data/.
// The app only ever loads these, never a raw dataset.

// root: a stage-1 picture character. costume: the side or top form of a root (亻 for 人).
// helper: a part a later compound needs, taught just before it. compound: built from earlier items.
export type Role = 'root' | 'costume' | 'helper' | 'compound';

export type EtymologyType = 'pictographic' | 'ideographic' | 'pictophonetic';

export interface Etymology {
  type: EtymologyType;
  hint?: string;
  // pictophonetic only: the meaning helper and the sound helper.
  semantic?: string;
  phonetic?: string;
}

// One file per character: public/data/chars/<codepoint>.json.
// strokes, medians and radStrokes are Hanzi Writer's format, so the file can be
// returned as-is from a charDataLoader.
export interface CharData {
  character: string;
  pinyin: string;
  gloss: string;
  definition: string;
  stage: number;
  order: number;
  role: Role;
  costumeOf?: string;
  decomposition: string;
  parts: string[];
  etymology?: Etymology;
  radical: string;
  // For each stroke, the path into the decomposition tree of the part it belongs to,
  // or null when the source does not say.
  matches: (number[] | null)[];
  // Name of each stroke in writing order (横, 竖, 撇折…), or null when not yet checked.
  strokeNames: string[] | null;
  frequencyRank: number | null;
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
}

export interface StageSummary {
  id: number;
  key: string;
  title: string;
  island: string;
  ready: boolean;
  chars: string[];
}

export interface IndexEntry {
  stage: number;
  order: number;
  role: Role;
  pinyin: string;
  gloss: string;
  frequencyRank: number | null;
}

// public/data/index.json
export interface DataIndex {
  stages: StageSummary[];
  chars: Record<string, IndexEntry>;
  // Root or part → the built characters that contain it, in learning order.
  families: Record<string, string[]>;
}

export const charFile = (char: string) =>
  `${char.codePointAt(0)!.toString(16)}.json`;
