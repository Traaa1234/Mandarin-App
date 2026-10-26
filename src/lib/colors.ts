export const INK = '#2b2b2b';
export const OUTLINE = '#e9dfcc';
export const GRID = '#d9c7a3';
// The root inside a character glows in this color while it is drawn.
export const RADICAL = '#f59f00';
// The newest stroke in the stroke-by-stroke row.
export const NEW_STROKE = '#e8590c';
// One color per part when a character is taken apart. Kept clear of the tone colors.
export const PART_COLORS = ['#f08c00', '#0ca678', '#e64980', '#795548'];
export const UNMATCHED = '#adb5bd';

export const partColor = (i: number) => (i < 0 ? UNMATCHED : PART_COLORS[i % PART_COLORS.length]);

// Same values as --color-tone-* in index.css; index 5 is the neutral tone.
export const TONE_COLORS = ['', '#c92a2a', '#237032', '#1864ab', '#8e44ad', '#5f666d'];
