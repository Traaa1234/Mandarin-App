import type { ReactNode } from 'react';
import Baobao from '../components/Baobao';
import { DRAGON, GAMES } from '../games/registry';
import { SECTIONS, type SectionId } from '../sections';

interface Item {
  icon: ReactNode;
  name: string;
  han?: string;
  pinyin?: string;
  text: string;
}

const START: Item[] = [
  { icon: '🐼', name: 'Pick who is playing', han: '你是谁？', pinyin: 'nǐ shì shéi?', text: 'The first time, each child picks an animal. That animal is their profile: no names, ages or accounts. Up to four children can share a device. Tap the animal at the top right of the home screen to change player.' },
  { icon: '🧡', name: 'Tap 今天 every day', han: '今天', pinyin: 'jīntiān', text: 'The big orange button is the daily adventure, about 5–8 minutes. It plants new characters, reviews old ones and unlocks everything else. Start here.' },
  { icon: '🔊', name: 'Tap to hear', text: 'Any 🔊 button, and most Chinese characters, play a native speaker. A child of five can play using taps and sound only; the English is for grown-ups and can be hidden.' },
];

const TOP: Item[] = [
  { icon: '☀️', name: 'Sunshine streak', text: 'The number counts practice days in a row. The seven suns are this week; each lit sun is a day played. Two rest days a week are allowed, so missing one or two days never resets it.' },
  { icon: '🐼', name: 'Player', text: 'Shows who is playing. Tap to switch to another child or add one.' },
  { icon: '🏮', name: 'Festival', text: 'Appears around Lunar New Year, the Dragon Boat Festival and Mid-Autumn. Tap for that festival’s characters and phrases.' },
  { icon: '🧡', name: 'Today’s adventure', han: '今天', pinyin: 'jīntiān', text: 'Five parts, always in the same order: water the flowers (review), find a seed (one to three new characters), play a game, say today’s phrase to Bǎobao, and open a gift. It ends with a goodbye; after that there is one bonus game.' },
];

const SHORTCUTS: Item[] = [
  { icon: '🌷', name: 'My garden', han: '花园', pinyin: 'huāyuán', text: 'One flower for every character learned. A flower blooms after it is reviewed and looks sleepy when it is due for practice. Flowers never die. Tap a flower to open its character. The garden levels up every few flowers, and decorations bought in the shop appear here.' },
  { icon: '🎮', name: 'Games', han: '游戏', pinyin: 'yóuxì', text: 'Nine short games using only characters already learned. A game shows 🔒 until enough characters are learned for it. Games earn seeds 🌰.' },
  { icon: '🗺️', name: 'Map', han: '地图', pinyin: 'dìtú', text: 'The learning path as islands, opened one at a time. Bǎobao stands on the island being learned now; each shows how many of its characters are flowers. Tap an island to see its characters (green ones are learned) and tap a character to explore it. A finished island gives a sticker and a 📜 printable certificate.' },
  { icon: '📒', name: 'Album', han: '相册', pinyin: 'xiàngcè', text: 'A sticker slot for every character. Stars show which of the four cards are done: See, Hear, Write, Tone. Badges for effort and variety and island stickers are kept here too.' },
  { icon: '🏪', name: 'Shop', han: '商店', pinyin: 'shāngdiàn', text: 'Spend seeds 🌰 on garden decorations, outfits for Bǎobao and garden backgrounds. Seeds are earned by playing today’s adventure and the games, so a new child starts with none and the items look greyed out. Nothing here costs real money.' },
];

const SECTION_TEXT: Record<SectionId, string> = {
  roots: 'Explore any character in five steps: 👀 watch it written, ✏️ stroke by stroke with each stroke’s name, ✂️ take it apart into its roots, 🧩 put it together, and 🌳 its family of characters that contain it. Use ◀ ▶ to move between steps; 🔊 says it.',
  pictures: 'Picture cards for the starter characters: a drawing turns into the real character, with a short memory line. 🔊 says the character, 💬 reads the memory line, 🌱 opens it in Character Roots, ◀ ▶ go to the next card.',
  speak: 'Everyday phrases grouped in scenes (meeting people, being polite, at the table, family…). ▶️ plays the phrase and 🐢 plays it slowly. A character with an orange dotted line opens in Character Roots when tapped. 🎤 records the child; the app then compares their tones with the model voice and 🔊🧒 plays their voice back. Nothing is recorded or sent anywhere.',
  pinyin: 'How Mandarin sounds are written. 🎵 Sounds, 🌈 Tones (with shapes and hand motions) and 📏 Rules teach; 🗺️ Pinyin chart, 🚂 Build a syllable, 👂 Which tone?, 🖌️ Tone painter and ⌨️ Type it are games to practise.',
};

const CARDS: Item[] = [
  { icon: '👀', name: 'See it', text: 'Look at the character and tap its picture, or look at its parts and tap the character they make.' },
  { icon: '👂', name: 'Hear it', text: 'Listen, then tap the character you heard.' },
  { icon: '✍️', name: 'Write it', text: 'Trace the character with a finger, stroke by stroke.' },
  { icon: '🌈', name: 'Tone it', text: 'Hear the character, then tap its tone shape.' },
];

const GROWN_UPS: Item[] = [
  { icon: '🔐', name: 'For grown-ups', text: 'Behind a small multiplication question. Shows each child’s week, minutes per day and trickiest characters. Settings: hide pinyin or English, sounds, vibration, the daily time limit, how strict tracing is, and a reminder you can add to your calendar. You can also export, import or delete a child’s progress.' },
  { icon: '😴', name: 'Daily limit', text: 'After the daily limit (20 minutes unless you change it) Bǎobao falls asleep until tomorrow. A grown-up can add ten more minutes.' },
  { icon: '👩', name: 'Teach Mom or Dad', text: 'Once a week the adventure invites your child to teach you what they learned. Play along!' },
  { icon: '📴', name: 'Offline and private', text: 'After the first visit the app works without internet, and can be added to the home screen (Share → Add to Home Screen). Progress stays on this device: no accounts, ads or purchases.' },
  { icon: 'ℹ️', name: 'About and credits', text: 'Lists the voices, character data and software the app uses, with their licenses.' },
];

function List({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i.name} className="flex gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center text-3xl" aria-hidden="true">
            {i.icon}
          </span>
          <div>
            <p className="font-bold">
              {i.name}
              {i.han && (
                <>
                  {' '}
                  <span lang="zh-Hans" className="han font-normal">{i.han}</span>{' '}
                  <span className="py text-sm font-normal text-ink/70">{i.pinyin}</span>
                </>
              )}
            </p>
            <p className="text-sm">{i.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Part({ title, open, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="rounded-3xl bg-white p-4 shadow-sm">
      <summary className="flex min-h-14 cursor-pointer items-center text-lg font-bold">{title}</summary>
      <div className="mt-2">{children}</div>
    </details>
  );
}

// How to play: what every button does, written for the grown-up beside the child.
export default function HelpScreen({ onHome }: { onHome: () => void }) {
  const sections: Item[] = SECTIONS.map((s) => ({
    icon: <span className="block size-10">{s.icon}</span>,
    name: s.english,
    han: s.han,
    pinyin: s.pinyin,
    text: SECTION_TEXT[s.id],
  }));
  const games: Item[] = [...GAMES, DRAGON].map((g) => ({ icon: g.icon, name: g.english, han: g.han, pinyin: g.pinyin, text: g.skill }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onHome} aria-label="Home" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95">
          ←
        </button>
        <h1 className="text-2xl font-bold">How to play</h1>
      </header>
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
        <Baobao size={80} mood="happy" outfit={null} />
        <p className="text-sm">
          Hanzi Garden teaches Mandarin Chinese to children aged 5–10, a few minutes a day. This guide is for the grown-up beside them: tap a heading to open it.
        </p>
      </div>
      <Part title="Getting started" open>
        <List items={START} />
      </Part>
      <Part title="Top of the home screen">
        <List items={TOP} />
      </Part>
      <Part title="The five small buttons">
        <List items={SHORTCUTS} />
        <p className="mt-3 text-sm text-ink/70">Each asks 你是谁？ (who are you?) first if no child is chosen. For a new child they start mostly empty or locked; one adventure fills them.</p>
      </Part>
      <Part title="The four big cards">
        <List items={sections} />
        <p className="mt-3 text-sm text-ink/70">These are open to explore any time, without a profile.</p>
      </Part>
      <Part title="Practice cards">
        <p className="mb-3 text-sm">Each character has four cards, unlocked one after another. The app judges the answers itself, so a child never grades their own work, and it brings each character back just before it would be forgotten.</p>
        <List items={CARDS} />
      </Part>
      <Part title="The games">
        <p className="mb-3 text-sm">Each takes about a minute. The Dragon Riddle comes on Sundays.</p>
        <List items={games} />
      </Part>
      <Part title="For grown-ups">
        <List items={GROWN_UPS} />
      </Part>
    </main>
  );
}
