import { SECTIONS, type SectionId } from '../sections';

export default function Home({ onOpen }: { onOpen: (id: SectionId) => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <h1 className="han mb-6 text-center text-4xl font-bold">
        <span className="block text-base font-normal">hànzì huāyuán</span>
        汉字花园
        <span className="mt-1 block text-base font-normal text-ink/60">Hanzi Garden</span>
      </h1>
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
