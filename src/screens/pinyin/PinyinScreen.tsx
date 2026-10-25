import { SECTIONS } from '../../sections';
import BuildGame from './BuildGame';
import ChartGame from './ChartGame';
import PainterGame from './PainterGame';
import RulesPage from './RulesPage';
import SoundsPage from './SoundsPage';
import TonesPage from './TonesPage';
import TypeGame from './TypeGame';
import { PageHeader } from './ui';
import WhichToneGame from './WhichToneGame';

// The playground's pages: sounds first, letters second, then the games.
export const PAGES = [
  { id: 'sounds', icon: '🎵', han: '声音', pinyin: 'shēngyīn', english: 'Sounds' },
  { id: 'tones', icon: '🌈', han: '声调', pinyin: 'shēngdiào', english: 'Tones' },
  { id: 'rules', icon: '📏', han: '规则', pinyin: 'guīzé', english: 'Rules' },
  { id: 'chart', icon: '🗺️', han: '拼音表', pinyin: 'pīnyīn biǎo', english: 'Pinyin chart' },
  { id: 'build', icon: '🚂', han: '拼一拼', pinyin: 'pīn yi pīn', english: 'Build a syllable' },
  { id: 'which', icon: '👂', han: '哪个声调', pinyin: 'nǎge shēngdiào', english: 'Which tone?' },
  { id: 'paint', icon: '🖌️', han: '画声调', pinyin: 'huà shēngdiào', english: 'Tone painter' },
  { id: 'type', icon: '⌨️', han: '打字', pinyin: 'dǎzì', english: 'Type it' },
] as const;

export type PageId = (typeof PAGES)[number]['id'];

export default function PinyinScreen({
  page,
  onHome,
  onPage,
}: {
  page?: string;
  onHome: () => void;
  onPage: (page: PageId | null) => void;
}) {
  const current = PAGES.find((p) => p.id === page);
  const section = SECTIONS.find((s) => s.id === 'pinyin')!;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      {current ? (
        <>
          <PageHeader han={current.han} pinyin={current.pinyin} english={current.english} onBack={() => onPage(null)} />
          {current.id === 'sounds' && <SoundsPage />}
          {current.id === 'tones' && <TonesPage />}
          {current.id === 'rules' && <RulesPage />}
          {current.id === 'chart' && <ChartGame />}
          {current.id === 'build' && <BuildGame />}
          {current.id === 'which' && <WhichToneGame />}
          {current.id === 'paint' && <PainterGame />}
          {current.id === 'type' && <TypeGame />}
        </>
      ) : (
        <>
          <PageHeader han={section.han} pinyin={section.pinyin} english={section.english} onBack={onHome} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PAGES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPage(p.id)}
                aria-label={p.english}
                className="flex min-h-36 flex-col items-center justify-center gap-1 rounded-3xl bg-white p-3 shadow-md transition active:scale-95"
              >
                <span className="text-5xl" aria-hidden="true">
                  {p.icon}
                </span>
                <span className="text-sm">{p.pinyin}</span>
                <span className="han -mt-1 text-2xl font-bold">{p.han}</span>
                <span className="text-xs text-ink/50">{p.english}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
