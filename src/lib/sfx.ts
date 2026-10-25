// Short feedback sounds made with the Web Audio API, so no files are needed.

let ctx: AudioContext | null = null;

function tone(freq: number, start: number, length: number, type: OscillatorType = 'sine', volume = 0.15) {
  ctx ??= new AudioContext();
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length);
}

// A rising two-note chime for a right answer.
export function chime() {
  try {
    tone(784, 0, 0.25);
    tone(1175, 0.12, 0.35);
  } catch {
    // Audio is a nice-to-have; ignore devices without Web Audio.
  }
}

// A soft, friendly "boop" for a try-again. Never a buzzer.
export function boop() {
  try {
    tone(330, 0, 0.2, 'triangle', 0.1);
  } catch {
    // As above.
  }
}

// Light haptics where the device supports them.
export const buzz = (ms = 15) => navigator.vibrate?.(ms);
