// On-device pitch tracking for record-and-compare. Nothing leaves the device.

export interface Frame {
  time: number;
  // Fundamental frequency in Hz, or null when the frame is silent or unvoiced.
  f0: number | null;
}

const MIN_HZ = 75;
const MAX_HZ = 600;

// YIN pitch estimate for one frame (de Cheveigné & Kawahara, 2002).
export function yin(frame: Float32Array, sampleRate: number, threshold = 0.15): number | null {
  const maxLag = Math.min(Math.floor(sampleRate / MIN_HZ), Math.floor(frame.length / 2));
  const minLag = Math.floor(sampleRate / MAX_HZ);
  const d = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < frame.length - maxLag; i++) {
      const diff = frame[i] - frame[i + lag];
      sum += diff * diff;
    }
    d[lag] = sum;
  }
  // Cumulative mean normalized difference.
  let running = 0;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  for (let lag = 1; lag <= maxLag; lag++) {
    running += d[lag];
    cmnd[lag] = running ? (d[lag] * lag) / running : 1;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (cmnd[lag] < threshold) {
      while (lag + 1 < maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
      // Parabolic interpolation around the minimum for sub-sample accuracy.
      const a = cmnd[lag - 1];
      const b = cmnd[lag];
      const c = cmnd[lag + 1];
      const shift = (a - c) / (2 * (a - 2 * b + c)) || 0;
      return sampleRate / (lag + shift);
    }
  }
  return null;
}

// Pitch every 10 ms. Frames quieter than `gate` (relative to the loudest) count as silent.
export function pitchTrack(samples: Float32Array, sampleRate: number, gate = 0.12): Frame[] {
  const size = 2 ** Math.ceil(Math.log2((sampleRate / MIN_HZ) * 2.2));
  const hop = Math.round(sampleRate * 0.01);
  const rms: number[] = [];
  for (let start = 0; start + size <= samples.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + size; i++) sum += samples[i] * samples[i];
    rms.push(Math.sqrt(sum / size));
  }
  const loudest = Math.max(...rms, 1e-9);
  return rms.map((level, n) => {
    const start = n * hop;
    const f0 = level / loudest < gate ? null : yin(samples.subarray(start, start + size), sampleRate);
    return { time: (start + size / 2) / sampleRate, f0 };
  });
}

const semitones = (hz: number, ref: number) => 12 * Math.log2(hz / ref);

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

// Split a track into one span per syllable. With known times (the model voice)
// use them. Otherwise keep the main burst of speech (sounds less than 0.6 s
// apart: children learning a phrase pause between syllables), merge its closest pieces until there is one per syllable, and if
// there are too few pieces share its voiced frames out evenly.
export function syllableSpans(track: Frame[], count: number, times?: [number, number][] | null): Frame[][] {
  if (times && times.length === count) {
    return times.map(([a, b]) => track.filter((f) => f.time >= a && f.time < b));
  }
  // Voiced runs as [first, last] frame indices; a gap of 3 frames (30 ms) splits.
  let runs: [number, number][] = [];
  track.forEach((f, i) => {
    if (!f.f0) return;
    const last = runs[runs.length - 1];
    if (last && i - last[1] <= 3) last[1] = i;
    else runs.push([i, i]);
  });
  runs = runs.filter(([a, b]) => b - a >= 3);
  if (!runs.length) return Array.from({ length: count }, () => []);

  const voicedIn = (r: [number, number][]) => r.reduce((n, [a, b]) => n + b - a + 1, 0);
  const clusters: [number, number][][] = [[runs[0]]];
  for (const r of runs.slice(1)) {
    const cluster = clusters[clusters.length - 1];
    if (r[0] - cluster[cluster.length - 1][1] <= 60) cluster.push(r);
    else clusters.push([r]);
  }
  let main = clusters.reduce((best, c) => (voicedIn(c) > voicedIn(best) ? c : best));

  while (main.length > count) {
    let at = 0;
    for (let i = 1; i < main.length - 1; i++) {
      if (main[i + 1][0] - main[i][1] < main[at + 1][0] - main[at][1]) at = i;
    }
    main = [...main.slice(0, at), [main[at][0], main[at + 1][1]], ...main.slice(at + 2)];
  }
  const voiced = (r: [number, number]) => track.slice(r[0], r[1] + 1).filter((f) => f.f0);
  if (main.length === count) return main.map(voiced);
  const all = main.flatMap(voiced);
  return Array.from({ length: count }, (_, i) =>
    all.slice(Math.floor((all.length * i) / count), Math.floor((all.length * (i + 1)) / count)),
  );
}

export const CONTOUR_POINTS = 16;

// Each syllable's pitch as CONTOUR_POINTS values in semitones from the speaker's
// own median, so a child's high voice and an adult's low one compare fairly.
export function contours(spans: Frame[][]): (number[] | null)[] {
  const ref = median(spans.flat().flatMap((f) => (f.f0 ? [f.f0] : [])));
  return spans.map((span) => {
    const all = span.flatMap((f) => (f.f0 ? [semitones(f.f0, ref)] : []));
    // Octave slips (sudden ±12 jumps, common in a creaky 3rd tone) are dropped,
    // then a 5-point median filter smooths what is left.
    const mid = median(all);
    const raw = all.filter((v) => Math.abs(v - mid) < 7);
    if (raw.length < 3) return null;
    const values = raw.map((_, i) => median(raw.slice(Math.max(0, i - 2), i + 3)));
    return Array.from({ length: CONTOUR_POINTS }, (_, i) => {
      // Median of a small window, which smooths out octave slips.
      const at = (i / (CONTOUR_POINTS - 1)) * (values.length - 1);
      const from = Math.max(0, Math.floor(at) - 1);
      return median(values.slice(from, Math.min(values.length, Math.floor(at) + 2)));
    });
  });
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const spread = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

// Stars for one syllable from how well the shapes match. Shapes are compared by
// correlation, so a child who exaggerates a rise isn't marked down; a level
// model tone (1st tone) is matched by a level line. Always at least one star.
export function toneStars(model: number[] | null, child: number[] | null): 1 | 2 | 3 {
  if (!model || !child) return 1;
  if (spread(model) < 1) {
    const flat = spread(child);
    return flat < 1.2 ? 3 : flat < 2.2 ? 2 : 1;
  }
  if (spread(child) < 0.4) return 1;
  const mm = mean(model);
  const cm = mean(child);
  const r =
    model.reduce((sum, m, i) => sum + (m - mm) * (child[i] - cm), 0) /
    (model.length * spread(model) * spread(child));
  return r > 0.7 ? 3 : r > 0.3 ? 2 : 1;
}
