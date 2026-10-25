// Microphone recording for record-and-compare. The recording lives only in
// memory as decoded samples: it is never stored or uploaded, and the microphone
// is released as soon as recording stops.

let ctx: AudioContext | null = null;
export const audioContext = () => (ctx ??= new AudioContext());

export const canRecord = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export interface Recording {
  // Ends the recording early; `result` then resolves.
  stop: () => void;
  // The decoded samples, once recording ends (by stop() or the time limit).
  result: Promise<AudioBuffer>;
}

export async function startRecording(maxSeconds: number): Promise<Recording> {
  // Raw input: noise suppression and gain control cut the start of syllables
  // and bend their pitch, which is exactly what we measure. Nothing plays while
  // the child speaks, so echo cancellation isn't needed either.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise<AudioBuffer>((resolve, reject) => {
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      try {
        const bytes = await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer();
        chunks.length = 0;
        resolve(await audioContext().decodeAudioData(bytes));
      } catch (err) {
        reject(err);
      }
    };
  });
  recorder.start();
  const timer = setTimeout(() => recorder.state === 'recording' && recorder.stop(), maxSeconds * 1000);
  return {
    stop: () => {
      clearTimeout(timer);
      if (recorder.state === 'recording') recorder.stop();
    },
    result: done,
  };
}

// Decode a bundled file (the model voice) to samples, cached per path.
const decoded = new Map<string, Promise<AudioBuffer>>();
export function decodeFile(path: string): Promise<AudioBuffer> {
  let p = decoded.get(path);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}${path}`)
      .then((r) => r.arrayBuffer())
      .then((b) => audioContext().decodeAudioData(b));
    decoded.set(path, p);
  }
  return p;
}

export function playBuffer(buffer: AudioBuffer) {
  const source = audioContext().createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext().destination);
  source.start();
}
