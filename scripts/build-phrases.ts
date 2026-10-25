// Builds one audio file per Speak Mandarin phrase.
//
//   npm run phrases        (needs ffmpeg and ffprobe on the PATH)
//
// For each phrase in content/phrases.json, in priority order:
// 1. content/phrase-audio/<id>.mp3, if present (e.g. made with a neural voice);
// 2. otherwise joined from audio-cmn recordings: a word of two or more characters
//    uses its word recording when the phrase keeps the word's tones, and
//    everything else uses the syllable recordings with the tones as spoken
//    (你好 → ní + hǎo). A neutral tone with no recording borrows a nearby tone
//    and the phrase is marked approximate.
// Writes public/audio/phrases/<id>.mp3 and public/data/phrases.json.

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Phrase, PhraseData } from '../src/data/types.ts';
import { splitSyllables, spokenTones } from '../src/lib/pinyin.ts';
import { stripTones } from '../src/lib/ids.ts';
import { toneOf } from '../src/lib/tones.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'audio', 'phrases');
const WORK = join(ROOT, '.cache', 'phrases');
const COMMIT = '59dbafbda8b172ffc3b8b295cd5938ae1b3de803';
const WORDS_RAW = `https://raw.githubusercontent.com/hugolpz/audio-cmn/${COMMIT}/24k-abr/hsk`;
const WORD_LIST = join(ROOT, '.cache', 'audio-cmn');

// Pauses between pieces, in seconds.
const GAP_IN_WORD = 0.03;
const GAP_BETWEEN_WORDS = 0.12;

interface ContentPhrase {
  id: string;
  chars: string;
  words: string[];
  pinyin: string;
  english: string;
  icon: string;
}

const isHan = (ch: string) => /\p{Script=Han}/u.test(ch);
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function recordedWords(): Set<string> {
  if (!existsSync(WORD_LIST)) {
    run('git', ['clone', '-q', '--filter=blob:none', '--no-checkout', 'https://github.com/hugolpz/audio-cmn', WORD_LIST]);
  }
  const names = run('git', ['-C', WORD_LIST, '-c', 'core.quotePath=false', 'ls-tree', '--name-only', COMMIT, '24k-abr/hsk/']);
  return new Set(names.split('\n').map((n) => n.replace('24k-abr/hsk/cmn-', '').replace(/\.mp3$/, '')));
}

async function wordFile(word: string): Promise<string> {
  const file = join(WORK, 'words', `${word}.mp3`);
  if (!existsSync(file)) {
    const res = await fetch(`${WORDS_RAW}/cmn-${encodeURIComponent(word)}.mp3`);
    if (!res.ok) throw new Error(`Download of word ${word} failed: HTTP ${res.status}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return file;
}

// Trim silence and even out loudness so pieces from two speakers sit together.
function prepare(input: string, output: string): number {
  run('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', input,
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB,loudnorm=I=-18:TP=-2:LRA=7',
    '-ar', '22050', '-ac', '1', output,
  ]);
  return Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', output]).trim());
}

async function main() {
  const content = JSON.parse(readFileSync(join(ROOT, 'content', 'phrases.json'), 'utf8')) as {
    scenes: { id: string; title: string; icon: string; phrases: ContentPhrase[] }[];
  };
  const syllables = new Set<string>(JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'syllables.json'), 'utf8')));
  const bases = new Set([...syllables].map((k) => k.slice(0, -1)));
  const words = recordedWords();

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  mkdirSync(WORK, { recursive: true });
  const errors: string[] = [];
  const data: PhraseData = { scenes: [] };

  for (const scene of content.scenes) {
    const phrases: Phrase[] = [];
    for (const p of scene.phrases) {
      const chars = Array.from(p.chars).filter(isHan);
      const written = splitSyllables(p.pinyin, bases);
      if (written.length !== chars.length) {
        errors.push(`${p.id}: ${chars.length} characters but ${written.length} pinyin syllables`);
        continue;
      }
      if (p.words.join('') !== chars.join('')) {
        errors.push(`${p.id}: words ${p.words.join(' ')} don't match the characters`);
        continue;
      }
      const tones = written.map(toneOf);
      const spoken = spokenTones(tones);
      // Syllables whose neutral tone had no recording and borrowed another.
      const borrowed = new Set<number>();
      const keys = written.map((s, i) => {
        const base = stripTones(s).replace(/ü/g, 'v');
        let key = `${base}${spoken[i]}`;
        if (!syllables.has(key) && spoken[i] === 5) {
          // Neutral tone after a 3rd tone sounds high, elsewhere low.
          key = `${base}${spoken[i - 1] === 3 ? 1 : 4}`;
          borrowed.add(i);
        }
        if (!syllables.has(key)) errors.push(`${p.id}: no recording for ${key}`);
        return key;
      });

      // The pieces to join, and how many syllables each covers.
      const pieces: { file: string; syllables: number; kind: 'word' | 'syllable'; gapAfter: number }[] = [];
      let approximate = false;
      let at = 0;
      for (const [w, word] of p.words.entries()) {
        const n = Array.from(word).length;
        const keepsTones = tones.slice(at, at + n).every((t, i) => t === spoken[at + i]);
        if (n > 1 && words.has(word) && keepsTones) {
          pieces.push({ file: await wordFile(word), syllables: n, kind: 'word', gapAfter: GAP_BETWEEN_WORDS });
        } else {
          for (let i = 0; i < n; i++) {
            const last = i === n - 1;
            if (borrowed.has(at + i)) approximate = true;
            pieces.push({
              file: join(ROOT, 'public', 'audio', 'syllables', `${keys[at + i]}.mp3`),
              syllables: 1,
              kind: 'syllable',
              gapAfter: last && w < p.words.length - 1 ? GAP_BETWEEN_WORDS : GAP_IN_WORD,
            });
          }
        }
        at += n;
      }

      const out = join(OUT, `${p.id}.mp3`);
      const override = join(ROOT, 'content', 'phrase-audio', `${p.id}.mp3`);
      let times: [number, number][] | null = null;
      let source: Phrase['source'];
      if (existsSync(override)) {
        copyFileSync(override, out);
        source = 'generated';
        approximate = false;
      } else {
        source = pieces.every((x) => x.kind === 'word') ? 'words' : pieces.some((x) => x.kind === 'word') ? 'mixed' : 'syllables';
        // Prepare each piece, then join them with short silences.
        const parts: string[] = [];
        times = [];
        let t = 0;
        for (const [i, piece] of pieces.entries()) {
          const prepared = join(WORK, `${p.id}-${i}.wav`);
          const length = prepare(piece.file, prepared);
          // A word's syllables share its length evenly; the pitch view only needs rough spans.
          for (let s = 0; s < piece.syllables; s++) {
            times.push([t + (length * s) / piece.syllables, t + (length * (s + 1)) / piece.syllables]);
          }
          t += length;
          parts.push(prepared);
          if (i < pieces.length - 1) {
            const gap = join(WORK, `gap-${piece.gapAfter}.wav`);
            if (!existsSync(gap)) {
              run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', String(piece.gapAfter), gap]);
            }
            parts.push(gap);
            t += piece.gapAfter;
          }
        }
        const list = join(WORK, `${p.id}.txt`);
        writeFileSync(list, parts.map((f) => `file '${f}'`).join('\n'));
        run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:a', 'libmp3lame', '-b:a', '48k', out]);
        times = times.map(([a, b]) => [Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
      }

      phrases.push({
        id: p.id,
        chars: p.chars,
        english: p.english,
        icon: p.icon,
        syllables: chars.map((char, i) => ({ char, written: written[i], key: keys[i], tone: tones[i], spokenTone: spoken[i] })),
        audio: `audio/phrases/${p.id}.mp3`,
        source,
        approximate,
        times,
      });
    }
    data.scenes.push({ id: scene.id, title: scene.title, icon: scene.icon, phrases });
  }

  if (errors.length) {
    console.error(`build-phrases found ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
    process.exit(1);
  }
  writeFileSync(join(ROOT, 'public', 'data', 'phrases.json'), JSON.stringify(data, null, 1) + '\n');
  const all = data.scenes.flatMap((s) => s.phrases);
  console.log(
    `${all.length} phrases: ${all.filter((p) => p.source === 'words').length} from word recordings, ` +
      `${all.filter((p) => p.source === 'mixed').length} mixed, ${all.filter((p) => p.source === 'syllables').length} from syllables, ` +
      `${all.filter((p) => p.source === 'generated').length} generated; approximate: ${all.filter((p) => p.approximate).map((p) => p.id).join(', ') || 'none'}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
