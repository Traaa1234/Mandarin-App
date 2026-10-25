// Downloads the audio-cmn syllable recordings the app ships.
//
//   npm run audio
//
// Writes public/audio/syllables/<syllable><tone>.mp3 (ü spelled v, neutral tone 5,
// as audio-cmn names them) and public/data/syllables.json, the list of syllables
// that have a recording. Files already on disk are kept, so re-runs are cheap.
// The recordings are committed, so the app builds and runs offline.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'audio', 'syllables');

// Pinned so the set of recordings is reproducible.
const REPO = 'https://github.com/hugolpz/audio-cmn';
const COMMIT = '59dbafbda8b172ffc3b8b295cd5938ae1b3de803';
// 24 kbps average bitrate: clear enough for tones, about 5 KB per syllable.
const SET = '24k-abr/syllabs';
const RAW = `https://raw.githubusercontent.com/hugolpz/audio-cmn/${COMMIT}/${SET}`;

// List the recordings with git, without downloading them.
function listSyllables(): string[] {
  const tmp = join(ROOT, '.cache', 'audio-cmn');
  if (!existsSync(tmp)) {
    execFileSync('git', ['clone', '-q', '--filter=blob:none', '--no-checkout', REPO, tmp]);
  }
  const names = execFileSync('git', ['-C', tmp, 'ls-tree', '--name-only', COMMIT, `${SET}/`], {
    encoding: 'utf8',
  });
  return names
    .split('\n')
    .map((n) => n.replace(`${SET}/cmn-`, '').replace(/\.mp3$/, ''))
    // Skip interjections such as _hm1 and _ng2; they are not part of the pinyin chart.
    .filter((k) => /^[a-zv]+[1-5]$/.test(k));
}

async function download(key: string) {
  const file = join(OUT, `${key}.mp3`);
  if (existsSync(file)) return;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${RAW}/cmn-${key}.mp3`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return;
    } catch (err) {
      if (attempt === 4) throw new Error(`Download of ${key} failed: ${err}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const keys = listSyllables().sort();
  mkdirSync(OUT, { recursive: true });
  let next = 0;
  const worker = async () => {
    while (next < keys.length) await download(keys[next++]);
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  writeFileSync(join(ROOT, 'public', 'data', 'syllables.json'), JSON.stringify(keys) + '\n');
  console.log(`${keys.length} syllable recordings in public/audio/syllables/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
