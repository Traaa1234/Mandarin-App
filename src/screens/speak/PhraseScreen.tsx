import { useEffect, useRef, useState } from 'react';
import { useIndex } from '../../data/useData';
import { allPhrases, usePhrases } from '../../data/usePhrases';
import type { Phrase } from '../../data/types';
import { playFile } from '../../lib/audio';
import { TONE_COLORS } from '../../lib/colors';
import { contours, pitchTrack, syllableSpans, toneStars } from '../../lib/pitch';
import { canRecord, decodeFile, playBuffer, startRecording, type Recording } from '../../lib/recorder';
import { buzz, chime } from '../../lib/sfx';
import { useProfile } from '../../practice/ProfileContext';
import { store } from '../../practice/store';
import PitchCompare from './PitchCompare';

const SLOW = 0.7;

type Result = { model: (number[] | null)[]; child: (number[] | null)[]; stars: number[]; buffer: AudioBuffer };

export default function PhraseScreen({
  id,
  onBack,
  onOpen,
  onChar,
}: {
  id: string;
  onBack: () => void;
  onOpen: (id: string) => void;
  onChar: (char: string) => void;
}) {
  const data = usePhrases();
  const index = useIndex();
  if (!data) return null;
  const phrases = allPhrases(data);
  const phrase = phrases.find((p) => p.id === id);
  if (!phrase) return null;
  const scene = data.scenes.find((s) => s.id === phrase.scene)!;
  const inScene = scene.phrases.map((p) => p.id);
  const at = inScene.indexOf(id);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center px-4 py-6">
      <header className="mb-4 flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the scenes"
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
        >
          ←
        </button>
        <span className="text-4xl" aria-hidden="true">
          {scene.icon}
        </span>
        <span className="text-ink/60">{scene.title}</span>
        <span className="ml-auto text-sm text-ink/50 tabular-nums">
          {at + 1} / {inScene.length}
        </span>
      </header>

      <div className="flex w-full flex-col items-center gap-4 rounded-3xl bg-white p-5 shadow-md">
        <span className="text-8xl" aria-hidden="true">
          {phrase.icon}
        </span>
        <Ruby phrase={phrase} known={(c) => !!index?.chars[c]} onChar={onChar} />
        <p className="en text-lg text-ink/60">{phrase.english}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => playFile(phrase.audio)}
            aria-label="Play"
            className="flex size-16 items-center justify-center rounded-2xl bg-[#ffe8a3] text-3xl shadow-md active:scale-95"
          >
            ▶️
          </button>
          <button
            type="button"
            onClick={() => playFile(phrase.audio, SLOW)}
            aria-label="Play slowly"
            className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95"
          >
            🐢
          </button>
        </div>
      </div>

      <RecordAndCompare key={phrase.id} phrase={phrase} />

      <div className="mt-auto flex w-full justify-between pt-6">
        <button
          type="button"
          onClick={() => at > 0 && onOpen(inScene[at - 1])}
          disabled={at === 0}
          aria-label="Previous phrase"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={() => at < inScene.length - 1 && onOpen(inScene[at + 1])}
          disabled={at === inScene.length - 1}
          aria-label="Next phrase"
          className="flex size-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95 disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </main>
  );
}

// Characters with their pinyin above them, each syllable in its tone color.
// A character the child can learn in Character Roots opens there when tapped.
function Ruby({ phrase, known, onChar }: { phrase: Phrase; known: (c: string) => boolean; onChar: (c: string) => void }) {
  let s = 0;
  return (
    <p className="han flex flex-wrap items-end justify-center text-5xl leading-none">
      {Array.from(phrase.chars).map((ch, i) => {
        const syl = /\p{Script=Han}/u.test(ch) ? phrase.syllables[s++] : null;
        if (!syl) return <span key={i}>{ch}</span>;
        const ruby = (
          <ruby className="px-0.5">
            {ch}
            <rt className="py pb-1 font-sans text-lg" style={{ color: TONE_COLORS[syl.tone] }}>
              {syl.written}
            </rt>
          </ruby>
        );
        return known(ch) ? (
          <button
            key={i}
            type="button"
            onClick={() => onChar(ch)}
            aria-label={`Open ${ch} in Character Roots`}
            className="min-h-14 rounded-xl underline decoration-[#f59f00] decoration-dotted decoration-4 underline-offset-8 active:scale-95"
          >
            {ruby}
          </button>
        ) : (
          <span key={i}>{ruby}</span>
        );
      })}
    </p>
  );
}

const CHEERS: Record<number, { han: string; pinyin: string }> = {
  3: { han: '太棒了！', pinyin: 'tài bàng le' },
  2: { han: '很好！', pinyin: 'hěn hǎo' },
  1: { han: '加油！', pinyin: 'jiāyóu' },
};

// Tap the mic, say the phrase, see both pitch lines syllable by syllable.
export function RecordAndCompare({ phrase }: { phrase: Phrase }) {
  const { current } = useProfile();
  const [state, setState] = useState<'idle' | 'recording' | 'thinking' | 'done' | 'no-mic'>(canRecord() ? 'idle' : 'no-mic');
  const [result, setResult] = useState<Result | null>(null);
  const recording = useRef<Recording | null>(null);

  // Stop the microphone if the child leaves mid-recording; the result is dropped.
  useEffect(
    () => () => {
      const r = recording.current;
      recording.current = null;
      r?.stop();
    },
    [],
  );

  const length = phrase.times ? phrase.times[phrase.times.length - 1][1] : phrase.syllables.length * 0.5;

  const analyse = async (child: AudioBuffer) => {
    const model = await decodeFile(phrase.audio);
    const n = phrase.syllables.length;
    const modelC = contours(syllableSpans(pitchTrack(model.getChannelData(0), model.sampleRate), n, phrase.times));
    const childC = contours(syllableSpans(pitchTrack(child.getChannelData(0), child.sampleRate), n));
    const stars = modelC.map((m, i) => toneStars(m, childC[i]));
    setResult({ model: modelC, child: childC, stars, buffer: child });
    setState('done');
    if (current) store.log(current.id!, 'speak', { phrase: phrase.id });
    if (Math.round(stars.reduce((a, b) => a + b, 0) / n) >= 2) {
      chime();
      buzz();
    }
  };

  const press = async () => {
    if (state === 'recording') {
      recording.current?.stop();
      return;
    }
    let rec: Recording;
    try {
      setResult(null);
      // Stops on its own after a generous time limit.
      rec = await startRecording(Math.max(3, length * 2 + 1.5));
    } catch {
      setState('no-mic');
      return;
    }
    recording.current = rec;
    setState('recording');
    try {
      const buffer = await rec.result;
      if (recording.current !== rec) return; // left the phrase meanwhile
      recording.current = null;
      setState('thinking');
      await analyse(buffer);
    } catch {
      recording.current = null;
      setState('idle');
    }
  };

  const overall = result ? Math.round(result.stars.reduce((a, b) => a + b, 0) / result.stars.length) : 0;

  return (
    <section className="mt-5 flex w-full flex-col items-center gap-4" aria-label="Say it">
      {state === 'no-mic' ? (
        <p className="text-sm text-ink/50">The microphone isn't available on this device.</p>
      ) : (
        <button
          type="button"
          onClick={press}
          disabled={state === 'thinking'}
          aria-label={state === 'recording' ? 'Stop' : 'Say it'}
          aria-pressed={state === 'recording'}
          className={`flex size-24 items-center justify-center rounded-full text-5xl shadow-md active:scale-95 ${
            state === 'recording' ? 'animate-pulse bg-[#ffd6d6] ring-8 ring-[#ffb3b3]' : 'bg-white'
          }`}
        >
          {state === 'recording' ? '⏹️' : state === 'thinking' ? '⏳' : '🎤'}
        </button>
      )}

      {result && (
        <>
          <p className="han text-3xl" aria-live="polite">
            <span className="block text-center text-base">{CHEERS[overall].pinyin}</span>
            {CHEERS[overall].han}
          </p>
          <PitchCompare syllables={phrase.syllables} model={result.model} child={result.child} stars={result.stars} />
          <button
            type="button"
            onClick={() => playBuffer(result.buffer)}
            aria-label="Hear my voice"
            className="flex min-h-14 items-center gap-2 rounded-2xl bg-white px-4 text-2xl shadow-md active:scale-95"
          >
            🔊 🧒
          </button>
        </>
      )}
    </section>
  );
}
