import { describe, expect, it } from 'vitest';
import { CONTOUR_POINTS, contours, pitchTrack, syllableSpans, toneStars, yin } from '../src/lib/pitch';

const RATE = 22050;

// A tone gliding from f1 to f2 Hz, with harmonics like a voice.
function glide(f1: number, f2: number, seconds: number): Float32Array {
  const out = new Float32Array(Math.round(RATE * seconds));
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const f = f1 + ((f2 - f1) * i) / out.length;
    phase += (2 * Math.PI * f) / RATE;
    out[i] = 0.6 * Math.sin(phase) + 0.3 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase);
  }
  return out;
}

const join = (...parts: Float32Array[]) => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
};

describe('pitch tracking', () => {
  it('finds the pitch of a steady voice-like tone', () => {
    const f0 = yin(glide(220, 220, 0.1).subarray(0, 1024), RATE);
    expect(f0).toBeGreaterThan(215);
    expect(f0).toBeLessThan(225);
  });

  it('follows a rising tone and ignores silence', () => {
    const track = pitchTrack(join(new Float32Array(RATE * 0.2), glide(150, 300, 0.5)), RATE);
    expect(track.slice(0, 5).every((f) => f.f0 === null)).toBe(true);
    const voiced = track.flatMap((f) => (f.f0 ? [f.f0] : []));
    expect(voiced[voiced.length - 1]).toBeGreaterThan(voiced[0] * 1.6);
  });

  it('splits two syllables at the pause and scores matching shapes highest', () => {
    const silence = new Float32Array(RATE * 0.12);
    // A 2nd tone then a 4th tone: rising, then falling.
    const model = pitchTrack(join(glide(140, 220, 0.35), silence, glide(240, 140, 0.35)), RATE);
    const same = pitchTrack(join(glide(220, 330, 0.3), silence, glide(360, 220, 0.3)), RATE);
    const flat = pitchTrack(join(glide(260, 260, 0.3), silence, glide(260, 260, 0.3)), RATE);
    const m = contours(syllableSpans(model, 2));
    const s = contours(syllableSpans(same, 2));
    const f = contours(syllableSpans(flat, 2));
    expect(m.every(Boolean)).toBe(true);
    expect(toneStars(m[0], s[0])).toBe(3);
    expect(toneStars(m[1], s[1])).toBe(3);
    expect(toneStars(m[0], f[0])).toBe(1);
    expect(toneStars(m[0], s[1])).toBe(1);
    expect(toneStars(m[0], null)).toBe(1);
  });

  it('keeps the main burst of speech and ignores a stray sound', () => {
    const silence = (s: number) => new Float32Array(Math.round(RATE * s));
    const track = pitchTrack(
      join(glide(140, 220, 0.35), silence(0.05), glide(240, 140, 0.35), silence(1.0), glide(300, 300, 0.15)),
      RATE,
    );
    const spans = syllableSpans(track, 2);
    const c = contours(spans);
    // Rising, then falling; the late hum is not mistaken for a syllable.
    expect(c[0]![CONTOUR_POINTS - 1]).toBeGreaterThan(c[0]![0]);
    expect(c[1]![CONTOUR_POINTS - 1]).toBeLessThan(c[1]![0]);
    expect(spans[1][spans[1].length - 1].time).toBeLessThan(0.9);
  });

  it('keeps a slow speaker\'s syllables together across a long pause', () => {
    const pause = new Float32Array(Math.round(RATE * 0.4));
    const spans = syllableSpans(pitchTrack(join(glide(140, 220, 0.3), pause, glide(240, 140, 0.3)), RATE), 2);
    expect(spans[0][0].time).toBeLessThan(0.1);
    expect(spans[1][0].time).toBeGreaterThan(0.6);
  });

  it('matches a level 1st tone with a level line', () => {
    const level = contours([pitchTrack(glide(250, 250, 0.4), RATE)])[0];
    const rising = contours([pitchTrack(glide(180, 300, 0.4), RATE)])[0];
    expect(toneStars(level, level)).toBe(3);
    expect(toneStars(level, rising)).toBe(1);
  });
});
