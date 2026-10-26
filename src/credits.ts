// Every dataset, library and voice in the app, with its license. Shown on the
// About and Credits screen; a test checks every shipped library is listed.

export interface Credit {
  name: string;
  // npm package names this credit covers, for the test.
  packages?: string[];
  what: string;
  by: string;
  license: string;
  // A same-origin license file, when the license requires its text to ship.
  licenseFile?: string;
  // Shown as plain text: the app has no outbound links.
  source: string;
  changes?: string;
}

export const VOICES: Credit[] = [
  {
    name: 'audio-cmn syllables',
    what: 'Every syllable recording (1,679 syllables) in the pinyin lessons, games and practice',
    by: 'Speaker: Chen Wang. Collection: audio-cmn by Hugo Lopez',
    license: 'CC BY-SA',
    source: 'github.com/hugolpz/audio-cmn',
    changes: 'The 24 kbps set, unchanged.',
  },
  {
    name: 'audio-cmn HSK words',
    what: 'Word recordings inside the Speak Mandarin phrases',
    by: 'Speaker: Yue Tan (from the Shtooka project). Collection: audio-cmn by Hugo Lopez',
    license: 'CC BY-SA',
    source: 'github.com/hugolpz/audio-cmn',
    changes:
      'Silence trimmed, loudness evened out, and joined with syllable recordings into phrases. The phrase recordings in this app are shared under the same license, CC BY-SA.',
  },
];

export const DATA: Credit[] = [
  {
    name: 'Make Me a Hanzi',
    what: 'Character parts, origins, the stroke-to-part map and definitions',
    by: 'Shaunak Kishore and contributors',
    license: 'GNU LGPL 3.0 or later',
    licenseFile: 'data/licenses/LGPL.txt',
    source: 'github.com/skishore/makemeahanzi',
    changes: 'Selected characters converted to one small file each.',
  },
  {
    name: 'Hanzi Writer data',
    what: 'Stroke shapes and stroke order',
    by: 'David Chanin, from Arphic fonts via Make Me a Hanzi',
    license: 'Arphic Public License',
    licenseFile: 'data/licenses/ARPHICPL.TXT',
    source: 'github.com/chanind/hanzi-writer-data',
  },
  {
    name: 'HanziJS',
    what: 'Character frequency, used when building the data (not shipped)',
    by: 'Niel de la Rouviere',
    license: 'MIT',
    source: 'github.com/nieldlr/hanzi',
  },
  {
    name: 'cjklib',
    what: 'Cross-check for stroke names, used when writing them (not shipped)',
    by: 'Christoph Burgmer',
    license: 'GNU LGPL 3.0 or later',
    source: 'github.com/cburgmer/cjklib',
  },
];

export const LIBRARIES: Credit[] = [
  { name: 'Hanzi Writer', packages: ['hanzi-writer'], what: 'Stroke animation and tracing', by: 'David Chanin', license: 'MIT', source: 'github.com/chanind/hanzi-writer' },
  { name: 'pinyin-pro', packages: ['pinyin-pro'], what: 'Pinyin tone marks and tone changes', by: 'zh-lx', license: 'MIT', source: 'github.com/zh-lx/pinyin-pro' },
  { name: 'ts-fsrs', packages: ['ts-fsrs'], what: 'Review scheduling (FSRS)', by: 'Open Spaced Repetition', license: 'MIT', source: 'github.com/open-spaced-repetition/ts-fsrs' },
  { name: 'Dexie.js', packages: ['dexie'], what: 'Saving progress on this device', by: 'David Fahlander and contributors', license: 'Apache 2.0', source: 'github.com/dexie/Dexie.js' },
  { name: 'React', packages: ['react', 'react-dom'], what: 'The user interface', by: 'Meta Platforms and contributors', license: 'MIT', source: 'github.com/facebook/react' },
  { name: 'Framer Motion', packages: ['framer-motion'], what: 'Animations', by: 'Framer and contributors', license: 'MIT', source: 'github.com/motiondivision/motion' },
  { name: 'Workbox (via vite-plugin-pwa)', what: 'Working offline', by: 'Google and contributors', license: 'MIT', source: 'github.com/GoogleChrome/workbox' },
  { name: 'Tailwind CSS', what: 'Styling', by: 'Tailwind Labs', license: 'MIT', source: 'github.com/tailwindlabs/tailwindcss' },
];

export const ORIGINAL =
  'Bǎobao, the picture cards and all other artwork were made for Hanzi Garden. The stroke names and memory lines were written for this app and still await a review by a Chinese teacher.';
