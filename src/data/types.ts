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

// The picture card. Pictures appear only once a parent or designer has approved them.
export interface Mnemonic {
  story: string;
  // Path under public/, e.g. mnemonics/597d.svg, or null while no approved picture exists.
  picture: string | null;
  // True when the story was generated from the etymology and parts, not written by hand.
  generated: boolean;
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
  mnemonic: Mnemonic;
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
  picture: string | null;
}

// public/data/index.json
export interface DataIndex {
  stages: StageSummary[];
  chars: Record<string, IndexEntry>;
  // Root or part → the built characters that contain it, in learning order.
  families: Record<string, string[]>;
}

const codepoint = (char: string) => char.codePointAt(0)!.toString(16);

export const charFile = (char: string) => `${codepoint(char)}.json`;
export const pictureFile = (char: string) => `mnemonics/${codepoint(char)}.svg`;

// public/data/phrases.json, written by scripts/build-phrases.ts.
export interface PhraseSyllable {
  char: string;
  // As written (nǐ), and the recording and tone as spoken (ni2, 2).
  written: string;
  key: string;
  tone: number;
  spokenTone: number;
}

export interface Phrase {
  id: string;
  chars: string;
  english: string;
  icon: string;
  syllables: PhraseSyllable[];
  audio: string;
  // generated: a dropped-in recording; otherwise joined from audio-cmn word and/or syllable recordings.
  source: 'generated' | 'words' | 'mixed' | 'syllables';
  // A neutral tone had no recording and borrowed a nearby tone.
  approximate: boolean;
  // Start and end of each syllable in the audio, in seconds; null for generated audio.
  times: [number, number][] | null;
}

export interface PhraseData {
  scenes: { id: string; title: string; icon: string; phrases: Phrase[] }[];
}
