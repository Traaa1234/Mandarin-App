// Builds the app's character data from the raw datasets.
//
//   npm run data
//
// Reads content/stages.json (the learning path), Make Me a Hanzi's dictionary.txt
// (decomposition, etymology, stroke-to-part matches), hanzi-writer-data (stroke paths)
// and HanziJS (frequency). Writes one compact JSON file per character to
// public/data/chars/ plus public/data/index.json. Words (the Word Village stage)
// go into the index only; their audio is built by build-phrases. Fails on any
// content error.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leaves, stripTones } from '../src/lib/ids.ts';
import { charFile, pictureFile } from '../src/data/types.ts';
import type { CharData, DataIndex, Etymology, Mnemonic, Role, WordEntry } from '../src/data/types.ts';
import { splitSyllables } from '../src/lib/pinyin.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'data');
const CACHE = join(ROOT, '.cache');

// Pinned so the build is reproducible. Bump deliberately and re-run the tests.
const MMAH_COMMIT = 'bddc96d41bef78427ed0e034e9f7e31d71fd1b92';
const MMAH_BASE = `https://raw.githubusercontent.com/skishore/makemeahanzi/${MMAH_COMMIT}`;

interface ContentItem {
  char: string;
  pinyin: string;
  gloss: string;
  role?: 'helper' | 'festival';
  costumeOf?: string;
}

interface ContentStage {
  id: number;
  key: string;
  title: string;
  island: string;
  ready: boolean;
  items?: ContentItem[];
  words?: ContentWord[];
}

// A word built only from characters taught earlier.
interface ContentWord {
  id: string;
  word: string;
  pinyin: string;
  gloss: string;
  icon: string;
}

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin: string[];
  decomposition: string;
  etymology?: Etymology;
  radical: string;
  matches: (number[] | null)[];
}

async function cached(name: string): Promise<string> {
  const file = join(CACHE, MMAH_COMMIT.slice(0, 12), name);
  if (!existsSync(file)) {
    console.log(`Downloading ${name} from Make Me a Hanzi…`);
    const res = await fetch(`${MMAH_BASE}/${name}`);
    if (!res.ok) throw new Error(`Download of ${name} failed: HTTP ${res.status}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, await res.text());
  }
  return file;
}

function loadDictionary(file: string): Map<string, MmahEntry> {
  const dict = new Map<string, MmahEntry>();
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const entry = JSON.parse(line) as MmahEntry;
    dict.set(entry.character, entry);
  }
  return dict;
}

async function main() {
  const require = createRequire(import.meta.url);
  const content = JSON.parse(readFileSync(join(ROOT, 'content', 'stages.json'), 'utf8')) as {
    stages: ContentStage[];
  };
  const strokeNames = JSON.parse(
    readFileSync(join(ROOT, 'content', 'stroke-names.json'), 'utf8'),
  ).names as Record<string, string | null>;
  const cards = JSON.parse(readFileSync(join(ROOT, 'content', 'mnemonics.json'), 'utf8')).cards as Record<
    string,
    { story: string; approved: boolean }
  >;
  const dict = loadDictionary(await cached('dictionary.txt'));
  const lgpl = await cached('LGPL');
  const strokeDir = dirname(require.resolve('hanzi-writer-data/package.json'));

  const hanzi = require('hanzi') as {
    start(): void;
    getCharacterFrequency(c: string): { number: string } | string | undefined;
  };
  hanzi.start();
  const frequencyRank = (c: string) => {
    const f = hanzi.getCharacterFrequency(c);
    return f && typeof f === 'object' ? Number(f.number) : null;
  };

  const errors: string[] = [];
  const built: CharData[] = [];
  const seen = new Map<string, CharData>();
  let order = 0;
  const words: Record<string, WordEntry> = {};
  const syllables = new Set<string>(JSON.parse(readFileSync(join(OUT, 'syllables.json'), 'utf8')));
  const bases = new Set([...syllables].map((k) => k.slice(0, -1)));

  for (const stage of content.stages) {
    if (stage.ready && stage.words) {
      for (const w of stage.words) {
        const where = `stage ${stage.id} ${w.word}`;
        const chars = Array.from(w.word);
        const written = splitSyllables(w.pinyin, bases);
        if (words[w.word] || Object.values(words).some((x) => x.id === w.id)) errors.push(`${where}: listed twice`);
        if (chars.length < 2) errors.push(`${where}: a word needs two or more characters`);
        if (written.length !== chars.length) errors.push(`${where}: ${chars.length} characters but pinyin ${w.pinyin}`);
        chars.forEach((c, i) => {
          const taught = seen.get(c);
          if (!taught || taught.role === 'festival') errors.push(`${where}: ${c} is not taught before this word`);
          else if (written[i] && stripTones(written[i]) !== stripTones(taught.pinyin)) {
            errors.push(`${where}: ${written[i]} doesn't match ${c} ${taught.pinyin}`);
          }
        });
        words[w.word] = { id: w.id, stage: stage.id, order: order++, pinyin: w.pinyin, gloss: w.gloss, icon: w.icon, audio: `audio/phrases/word-${w.id}.mp3` };
      }
    }
    if (!stage.ready || !stage.items) continue;
    for (const item of stage.items) {
      const c = item.char;
      const where = `stage ${stage.id} ${c}`;
      if (seen.has(c)) {
        errors.push(`${where}: listed twice`);
        continue;
      }
      const entry = dict.get(c);
      const strokeFile = join(strokeDir, `${c}.json`);
      if (!entry) errors.push(`${where}: not in Make Me a Hanzi`);
      if (!existsSync(strokeFile)) errors.push(`${where}: no stroke data in hanzi-writer-data`);
      if (!entry || !existsSync(strokeFile)) continue;

      const readings = entry.pinyin.map(stripTones);
      if (!readings.includes(stripTones(item.pinyin))) {
        errors.push(`${where}: pinyin ${item.pinyin} not among dictionary readings ${entry.pinyin.join(', ')}`);
      }

      const role: Role = item.costumeOf
        ? 'costume'
        : item.role === 'helper' || item.role === 'festival'
          ? item.role
          : stage.id === 1
            ? 'root'
            : 'compound';

      if (item.costumeOf && !seen.has(item.costumeOf)) {
        errors.push(`${where}: costume of ${item.costumeOf}, which is not taught earlier`);
      }

      // A child only meets a compound after learning every part inside it.
      const parts = role === 'compound' ? [...new Set(leaves(entry.decomposition))] : [];
      if (role === 'compound' && leaves(entry.decomposition).length < 2) {
        errors.push(`${where}: decomposition ${entry.decomposition} has fewer than two known parts`);
      }
      for (const part of parts) {
        if (!seen.has(part)) errors.push(`${where}: part ${part} is not taught before it`);
      }

      const strokeData = JSON.parse(readFileSync(strokeFile, 'utf8')) as Pick<
        CharData,
        'strokes' | 'medians' | 'radStrokes'
      >;
      if (entry.matches.length !== strokeData.strokes.length) {
        errors.push(
          `${where}: ${entry.matches.length} matches but ${strokeData.strokes.length} strokes`,
        );
      }

      // Every character needs an entry in stroke-names.json; null means "not checked yet".
      const names = strokeNames[c] === undefined ? undefined : strokeNames[c]?.split(' ') ?? null;
      if (names === undefined) errors.push(`${where}: missing from content/stroke-names.json`);
      else if (names && names.length !== strokeData.strokes.length) {
        errors.push(`${where}: ${names.length} stroke names but ${strokeData.strokes.length} strokes`);
      }

      const data: CharData = {
        character: c,
        pinyin: item.pinyin,
        gloss: item.gloss,
        definition: entry.definition ?? '',
        stage: stage.id,
        order: order++,
        role,
        ...(item.costumeOf ? { costumeOf: item.costumeOf } : {}),
        decomposition: entry.decomposition,
        parts,
        ...(entry.etymology ? { etymology: entry.etymology } : {}),
        radical: entry.radical,
        matches: entry.matches,
        strokeNames: names ?? null,
        frequencyRank: frequencyRank(c),
        mnemonic: { story: '', picture: null, generated: true },
        strokes: strokeData.strokes,
        medians: strokeData.medians,
        ...(strokeData.radStrokes ? { radStrokes: strokeData.radStrokes } : {}),
      };
      seen.set(c, data);
      built.push(data);
    }
  }

  // Picture cards: a hand-written card where one exists, otherwise a memory line
  // generated from the parts or the etymology, with the picture queued for review.
  const describe = (c: string) => `${c} ${seen.get(c)?.gloss ?? ''}`.trim();
  const queue: { character: string; story: string }[] = [];
  for (const c of Object.keys(cards)) {
    if (!seen.has(c)) errors.push(`content/mnemonics.json: ${c} is not a built character`);
  }
  for (const data of built) {
    const card = cards[data.character];
    let mnemonic: Mnemonic;
    if (card) {
      const file = pictureFile(data.character);
      if (!existsSync(join(ROOT, 'public', file))) errors.push(`${data.character}: picture ${file} is missing`);
      mnemonic = { story: card.story, picture: card.approved ? file : null, generated: false };
    } else {
      const story =
        data.role === 'compound'
          ? `${leaves(data.decomposition).map(describe).join(' + ')} = ${describe(data.character)}.`
          : data.role === 'costume'
            ? `${data.character} is ${describe(data.costumeOf!)} in costume.`
            : (data.etymology?.hint ?? `${describe(data.character)}.`);
      mnemonic = { story, picture: null, generated: true };
    }
    if (!mnemonic.picture) queue.push({ character: data.character, story: mnemonic.story });
    data.mnemonic = mnemonic;
  }

  if (errors.length) {
    console.error(`build-data found ${errors.length} problem(s):\n- ${errors.join('\n- ')}`);
    process.exit(1);
  }

  // Family reverse index: a compound joins the family of each part, and of the
  // root a costume part stands for (休 contains 亻, so it is in 人's family too).
  const families: Record<string, string[]> = {};
  for (const data of built) {
    for (const part of data.parts) {
      const owners = [part, seen.get(part)?.costumeOf].filter((p): p is string => !!p);
      for (const owner of owners) {
        const family = (families[owner] ??= []);
        if (!family.includes(data.character)) family.push(data.character);
      }
    }
  }

  const index: DataIndex = {
    stages: content.stages.map(({ id, key, title, island, ready }) => ({
      id,
      key,
      title,
      island,
      ready,
      chars: [...built.filter((d) => d.stage === id).map((d) => d.character), ...Object.keys(words).filter((w) => words[w].stage === id)],
    })),
    chars: Object.fromEntries(
      built.map((d) => [
        d.character,
        {
          stage: d.stage,
          order: d.order,
          role: d.role,
          pinyin: d.pinyin,
          gloss: d.gloss,
          frequencyRank: d.frequencyRank,
          picture: d.mnemonic.picture,
        },
      ]),
    ),
    families,
    words,
  };

  rmSync(join(OUT, 'chars'), { recursive: true, force: true });
  mkdirSync(join(OUT, 'chars'), { recursive: true });
  for (const data of built) {
    writeFileSync(join(OUT, 'chars', charFile(data.character)), JSON.stringify(data) + '\n');
  }
  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 1) + '\n');

  // Pictures still to draw or approve. Not shipped; for the parent or designer.
  mkdirSync(join(ROOT, 'content', 'generated'), { recursive: true });
  writeFileSync(
    join(ROOT, 'content', 'generated', 'picture-queue.json'),
    JSON.stringify({ note: 'Generated by npm run data. Characters with no approved picture yet.', queue }, null, 2) + '\n',
  );

  // The derived data must travel with the licenses of its sources.
  mkdirSync(join(OUT, 'licenses'), { recursive: true });
  copyFileSync(join(strokeDir, 'ARPHICPL.TXT'), join(OUT, 'licenses', 'ARPHICPL.TXT'));
  copyFileSync(lgpl, join(OUT, 'licenses', 'LGPL.txt'));

  console.log(
    `Wrote ${built.length} characters and ${Object.keys(words).length} words across ${index.stages.filter((s) => s.chars.length).length} stages to public/data/.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
