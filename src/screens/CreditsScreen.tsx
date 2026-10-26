import Baobao from '../components/Baobao';
import { DATA, LIBRARIES, ORIGINAL, VOICES, type Credit } from '../credits';

// About and Credits: every dataset, library and voice, with its license.
export default function CreditsScreen({ onHome }: { onHome: () => void }) {
  const base = import.meta.env.BASE_URL;
  const list = (title: string, credits: Credit[]) => (
    <section aria-label={title} className="rounded-3xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <ul className="flex flex-col gap-4">
        {credits.map((c) => (
          <li key={c.name}>
            <p className="font-bold">{c.name}</p>
            <p className="text-sm">{c.what}</p>
            <p className="text-sm text-ink/70">{c.by}</p>
            <p className="text-sm">
              License: {c.license}
              {c.licenseFile && (
                <>
                  {' '}
                  (
                  <a href={`${base}${c.licenseFile}`} className="inline-flex min-h-14 min-w-14 items-center justify-center underline">
                    full text
                  </a>
                  )
                </>
              )}
            </p>
            {c.changes && <p className="text-sm text-ink/70">Changes: {c.changes}</p>}
            <p className="text-sm break-all text-ink/70">Source: {c.source}</p>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onHome} aria-label="Home" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95">
          ←
        </button>
        <h1 className="text-2xl font-bold">About and credits</h1>
      </header>
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
        <Baobao size={80} outfit={null} />
        <p className="text-sm">
          Hanzi Garden teaches Mandarin Chinese in Simplified characters. It has no ads, no accounts and no purchases; progress stays on this device.
        </p>
      </div>
      {list('Voices', VOICES)}
      {list('Character data', DATA)}
      {list('Software', LIBRARIES)}
      <p className="rounded-3xl bg-white p-4 text-sm shadow-sm">{ORIGINAL}</p>
    </main>
  );
}
