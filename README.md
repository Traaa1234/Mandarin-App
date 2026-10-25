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

Stages 6 (sound helpers) and 7 (words) are drafted in the content file with
`"ready": false`; flip the flag when they're filled in.

## Data sources and licenses

| Source | Used for | License |
|---|---|---|
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) `dictionary.txt`, pinned commit | Decomposition, etymology, stroke-to-part map, definitions | LGPL-3.0 or later (copy in `public/data/licenses/LGPL.txt`) |
| [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) | Stroke paths and medians | Arphic Public License (copy in `public/data/licenses/ARPHICPL.TXT`) |
| [HanziJS](https://github.com/nieldlr/hanzi) | Character frequency rank, at build time only | MIT |
| [Hanzi Writer](https://github.com/chanind/hanzi-writer) | Stroke animation and tracing (next milestone) | MIT |

Before any app-store release, re-check each license against how the app is
distributed. In particular, the Arphic license and the LGPL both require the
license text to ship with the data, and audio-cmn (planned) is CC BY-SA and
needs credit to its speakers.

## Milestones

1. **Data pipeline** for the 20 stage-1 roots, the stage-3 side forms and the
   stage 4–5 characters, with tests. *Done.*
2. Character Roots detail screen: watch, stroke by stroke, take apart, put
   together, family.
3. Picture cards and morph animation for the 20 starter mnemonics.
4. Pinyin Playground.
5. Speak Mandarin.
6. Practice and game layer: FSRS scheduling, daily adventure, mascot,
   mini-games, garden, parent area.
7. Offline PWA mode, credits screen, accessibility pass.
