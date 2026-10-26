# Hanzi Garden (汉字花园)

An offline-first web app that teaches Mandarin Chinese to children aged 5–10:
character roots, picture cards, speaking, and pinyin. No ads, accounts or
network requests after install; progress stays on the device.

## Run it

```sh
npm install
npm run dev        # local dev server
npm test           # unit and data tests
npm run build      # typecheck + production build into dist/
npm run data       # rebuild public/data/ from the raw datasets
```

## How the character data works

`content/stages.json` is the learning path: seven stages, taught in order,
with hand-checked pinyin and child-friendly English for every item. A compound
character may only use parts taught earlier (亻 and 木 come before 休).

`scripts/build-data.ts` joins that with the raw datasets and writes:

- `public/data/chars/<codepoint>.json`: one file per character, with stroke
  paths, the stroke-to-part map, decomposition and etymology. The stroke
  fields are in Hanzi Writer's format, so a file can be handed straight to a
  `charDataLoader`.
- `public/data/index.json`: stages, a summary of every character, and the
  family index (each root → the characters that contain it).

The script stops with a list of problems if a character is missing from a
dataset, a compound uses a part not yet taught, or the pinyin doesn't match
the dictionary. The generated files are committed, so the app builds without
network access. The app never loads a raw dataset.

`content/stroke-names.json` names every stroke (横, 竖, 撇折…) in writing
order, following the standard school stroke order. The build checks the count
against the stroke data, and a test checks that each simple stroke points the
way its name says. 艸 is not yet named. The list needs a review by a Chinese
teacher before release.

`content/mnemonics.json` holds the picture cards: the memory line for each
starter character and whether its picture is approved. The pictures are
original flat SVGs in `public/mnemonics/`, drawn in the character's own
coordinates so the real strokes sit exactly on them. A picture reaches a child
only when `approved` is true. Every other character gets a memory line
generated from its parts or etymology, and is listed in
`content/generated/picture-queue.json` until someone draws and approves its
picture.

`npm run audio` downloads the audio-cmn syllable recordings (24 kbps, about
7 MB for 1,679 syllables) into `public/audio/syllables/` and lists them in
`public/data/syllables.json`. They are committed, so the app works offline.
The pinyin chart is built from that list, so every cell is a real syllable
with sound. Most neutral-tone recordings don't exist in audio-cmn; the tone
lessons use ba (bā bá bǎ bà ba), which has all five.

`content/pinyin.json` holds the Pinyin Playground: the sound groups, what each
tile plays, and the five rules with their practice items. Tests check that
every sound has a recording and that the tone-mark and 一/不 answers agree
with pinyin-pro.

`npm run phrases` (needs ffmpeg) builds one audio file per Speak Mandarin
phrase from `content/phrases.json`. A word of two or more characters uses
audio-cmn's word recording when the phrase keeps its tones; everything else is
joined from syllable recordings with the tones as spoken (你好 → ní + hǎo).
Two phrases borrow a tone because audio-cmn has no neutral-tone recording for
了 and 上 (我饿了, 早上好); they are marked `approximate`. To replace any
phrase with a better recording, for example from a neural voice, save it as
`content/phrase-audio/<id>.mp3` and run `npm run phrases` again.

Record and compare runs entirely on the device: the microphone recording is
decoded into memory, its pitch is tracked with YIN every 10 ms, and each
syllable's contour is compared with the model voice's. Nothing is stored or
uploaded, and the microphone is released when recording stops. Browser speech
recognition is not used; it can send audio to a server, so it waits for the
parent gate.

Practice (`src/practice/`) keeps each child's progress on the device in
IndexedDB (Dexie): up to four profiles, each just an animal avatar. Every
character has four cards, unlocked one after another: See it, Hear it, Write
it (Hanzi Writer's tracing quiz) and Tone it; helper parts with nothing to
look at start at Hear it. Results become FSRS ratings automatically (ts-fsrs),
following the spec's table, so a child never grades themselves. A session is
up to 10 due reviews, then up to 3 new characters, capped at 8 minutes.

The daily adventure (今天 on the home screen) always has the same five parts:
water the flowers (due reviews), find a seed (new characters hatch and are
introduced), play (Character Catch with learned characters), say today's
phrase to Bǎobao, and open a gift before a goodbye that names the seedling
blooming tomorrow. Bǎobao, the app's own panda gardener, is drawn in
`src/components/Baobao.tsx`; his lines (太棒了！, 加油！, 明天见！) are built
like the phrases. Every learned character is a flower in the garden: it blooms
after a review, looks sleepy when overdue, and never dies. The map shows the
seven stages as islands, opened in order.

Stages 6 (sound helpers) and 7 (words) are drafted in the content file with
`"ready": false`; flip the flag when they're filled in.

## Data sources and licenses

| Source | Used for | License |
|---|---|---|
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) `dictionary.txt`, pinned commit | Decomposition, etymology, stroke-to-part map, definitions | LGPL-3.0 or later (copy in `public/data/licenses/LGPL.txt`) |
| [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) | Stroke paths and medians | Arphic Public License (copy in `public/data/licenses/ARPHICPL.TXT`) |
| [cjklib](https://github.com/cburgmer/cjklib) `strokeorder.csv` | Cross-check for stroke names (not shipped) | LGPL-3.0 or later |
| [audio-cmn](https://github.com/hugolpz/audio-cmn) syllables, pinned commit | Native recordings of every syllable; speaker Chen Wang | CC BY-SA, credit required |
| [audio-cmn](https://github.com/hugolpz/audio-cmn) HSK words, pinned commit | Word recordings inside phrases; speaker Yue Tan | CC BY-SA, credit required |
| [pinyin-pro](https://github.com/zh-lx/pinyin-pro) | Tone-mark conversion, 一/不 tone changes | MIT |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | Review scheduling (FSRS) | MIT |
| [Dexie](https://github.com/dexie/Dexie.js) | Progress storage in IndexedDB | Apache-2.0 |
| [HanziJS](https://github.com/nieldlr/hanzi) | Character frequency rank, at build time only | MIT |
| [Hanzi Writer](https://github.com/chanind/hanzi-writer) | Stroke animation; tracing later | MIT |
| [Framer Motion](https://github.com/motiondivision/motion) | The put-together animation | MIT |

Before any app-store release, re-check each license against how the app is
distributed. In particular, the Arphic license and the LGPL both require the
license text to ship with the data, and audio-cmn is CC BY-SA and needs
credit to its speakers, Chen Wang and Yue Tan, on the credits screen.

## Milestones

1. **Data pipeline** for the 20 stage-1 roots, the stage-3 side forms and the
   stage 4–5 characters, with tests. *Done.*
2. **Character Roots detail screen**: watch, stroke by stroke, take apart, put
   together, family, for every seed character. *Done.* Tracing and the
   Build-a-Character game come with the practice and game layer.
3. **Picture cards** and the morph animation for the 20 starter mnemonics.
   *Done.*
4. **Pinyin Playground**: sounds, tones with shapes and hand motions, the
   five rules with practice, and the five games (chart, build a syllable,
   which tone, tone painter, type it). *Done.*
5. **Speak Mandarin**: six scenes, 17 phrases with ruby pinyin, slow
   playback, and on-device record-and-compare. *Done.* Phrase pictures are
   emoji for now.
6. Practice and game layer, in three parts:
   1. **Profiles, progress storage, FSRS scheduling and the four practice
      cards.** *Done.*
   2. **Daily adventure, the Bǎobao mascot, the garden and the island map.**
      *Done.*
   3. Mini-games, rewards and the parent area.
7. Offline PWA mode, credits screen, accessibility pass.
