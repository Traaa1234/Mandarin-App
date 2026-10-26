import { useProfile } from '../practice/ProfileContext';
import { SECTIONS, type SectionId } from '../sections';

export default function Home({ onOpen }: { onOpen: (id: SectionId | 'today') => void }) {
  const { current, choose } = useProfile();
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      {current && (
        <button
          type="button"
          onClick={() => choose(null)}
          aria-label={`Playing as ${current.animal}. Change player`}
          className="ml-auto flex size-16 items-center justify-center rounded-full bg-white text-4xl shadow-md active:scale-95"
        >
          {current.animal}
        </button>
      )}
      <h1 className="han mb-6 text-center text-4xl font-bold">
        <span className="block text-base font-normal">hànzì huāyuán</span>
        汉字花园
        <span className="mt-1 block text-base font-normal text-ink/60">Hanzi Garden</span>
      </h1>
      <button
        type="button"
        onClick={() => onOpen('today')}
        aria-label="Today's practice"
        className="mb-4 flex min-h-24 items-center justify-center gap-4 rounded-3xl bg-[#f59f00] px-4 text-white shadow-md transition active:scale-95"
      >
        <span className="text-5xl" aria-hidden="true">
          🌱
        </span>
        <span className="han text-4xl font-bold">
          <span className="block text-base font-normal">jīntiān</span>今天
        </span>
      </button>
      <div className="grid flex-1 grid-cols-2 gap-4 sm:gap-6">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen(s.id)}
            aria-label={s.english}
            className={`${s.color} flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl p-4 shadow-md transition active:scale-95`}
          >
            <span className="block size-20 sm:size-28">{s.icon}</span>
            <span className="text-base">{s.pinyin}</span>
            <span className="han -mt-2 text-3xl font-bold sm:text-4xl">{s.han}</span>
            <span className="text-sm opacity-70">{s.english}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
