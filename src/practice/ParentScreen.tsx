import { useEffect, useRef, useState } from 'react';
import { useIndex } from '../data/useData';
import type { DataIndex } from '../data/types';
import { toneClass } from '../lib/tones';
import { addDays, localDate, weekId } from './calendar';
import { reminderIcs } from './ics';
import ParentGate from './ParentGate';
import { useProfile } from './ProfileContext';
import { leniencyFor, useSettings } from './settings';
import { store } from './store';
import { sunshineStreak, WEEKLY_GOAL } from './streak';

const BAR = '#e8590c';

// The parent area, behind the parent gate: progress per child, settings, and data.
export default function ParentScreen({ onHome }: { onHome: () => void }) {
  const [open, setOpen] = useState(false);
  const index = useIndex();
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <button type="button" onClick={onHome} aria-label="Home" className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-md active:scale-95">
          ←
        </button>
        <h1 className="text-2xl font-bold">For grown-ups</h1>
      </header>
      {!open ? <ParentGate onPass={() => setOpen(true)} onCancel={onHome} /> : index && <ParentArea index={index} />}
    </main>
  );
}

function ParentArea({ index }: { index: DataIndex }) {
  const { profiles } = useProfile();
  const [child, setChild] = useState<number | null>(null);
  const shown = child ?? profiles?.[0]?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      {profiles && profiles.length > 0 && (
        <nav className="flex gap-2" aria-label="Children">
          {profiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setChild(p.id!)}
              aria-pressed={p.id === shown}
              className={`flex size-14 items-center justify-center rounded-full text-3xl shadow-sm ${p.id === shown ? 'bg-[#ffe8a3] ring-4 ring-[#f59f00]' : 'bg-white'}`}
            >
              {p.animal}
            </button>
          ))}
        </nav>
      )}
      {shown !== null && <ChildReport key={shown} profileId={shown} index={index} />}
      <SettingsPanel />
      <DataPanel />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm" aria-label={title}>
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
    </section>
  );
}

interface Report {
  learned: number;
  streak: number;
  week: { days: number; minutes: number; reviews: number; newChars: number };
  daily: { date: string; minutes: number }[];
  tricky: { char: string; misses: number }[];
}

async function buildReport(profileId: number, now = new Date()): Promise<Report> {
  const [learned, practised, days, reviews] = await Promise.all([
    store.learned(profileId),
    store.practisedDays(profileId),
    store.days(profileId),
    store.reviews(profileId),
  ]);
  const week = weekId(now);
  const inWeek = (d: Date) => weekId(d) === week;
  const msByDate = new Map(days.map((d) => [d.date, d.ms]));
  const firstSeen = new Map<string, Date>();
  for (const r of [...reviews].sort((a, b) => a.at.getTime() - b.at.getTime())) if (!firstSeen.has(r.char)) firstSeen.set(r.char, r.at);
  // The trickiest characters: the most cards needing help (rated Again).
  const misses = new Map<string, number>();
  for (const r of reviews) if (r.rating === 1) misses.set(r.char, (misses.get(r.char) ?? 0) + 1);
  return {
    learned: learned.size,
    streak: sunshineStreak(practised, now),
    week: {
      days: days.filter((d) => d.ms > 0 && weekId(new Date(`${d.date}T12:00:00`)) === week).length,
      minutes: Math.round(days.filter((d) => weekId(new Date(`${d.date}T12:00:00`)) === week).reduce((n, d) => n + d.ms, 0) / 60000),
      reviews: reviews.filter((r) => inWeek(r.at)).length,
      newChars: [...firstSeen.values()].filter(inWeek).length,
    },
    daily: Array.from({ length: 14 }, (_, i) => {
      const date = localDate(addDays(now, i - 13));
      return { date, minutes: Math.round((msByDate.get(date) ?? 0) / 60000) };
    }),
    tricky: [...misses].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([char, n]) => ({ char, misses: n })),
  };
}

function ChildReport({ profileId, index }: { profileId: number; index: DataIndex }) {
  const [report, setReport] = useState<Report | null>(null);
  useEffect(() => {
    buildReport(profileId).then(setReport);
  }, [profileId]);
  if (!report) return null;

  return (
    <>
      <Card title="This week">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Days practised', `${report.week.days} / ${WEEKLY_GOAL}`],
            ['Minutes', report.week.minutes],
            ['Cards reviewed', report.week.reviews],
            ['New characters', report.week.newChars],
            ['Characters learned', report.learned],
            ['Sunshine streak', `${report.streak} days`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#fdf6e3] p-3">
              <dt className="text-xs text-ink/60">{label}</dt>
              <dd className="text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Minutes practised per day">
        <MinutesChart daily={report.daily} />
      </Card>
      <Card title="Trickiest characters">
        {report.tricky.length ? (
          <ol className="flex flex-wrap gap-3">
            {report.tricky.map((t) => (
              <li key={t.char} className="flex flex-col items-center rounded-2xl bg-[#fdf6e3] px-3 py-2">
                <span className={`text-sm ${toneClass(index.chars[t.char]?.pinyin ?? '')}`}>{index.chars[t.char]?.pinyin}</span>
                <span className="han text-4xl">{t.char}</span>
                <span className="text-xs text-ink/60">needed help {t.misses}×</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink/60">Nothing tricky yet.</p>
        )}
      </Card>
    </>
  );
}

// Single series, one hue; thin bars with rounded tops, value on hover, and a table view.
function MinutesChart({ daily }: { daily: { date: string; minutes: number }[] }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const W = 320;
  const H = 140;
  const pad = { l: 28, b: 22, t: 10 };
  const max = Math.max(10, ...daily.map((d) => d.minutes));
  const step = (W - pad.l) / daily.length;
  const y = (m: number) => H - pad.b - (m / max) * (H - pad.b - pad.t);
  const day = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' });

  return (
    <div>
      {table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink/60">
              <th className="font-normal">Day</th>
              <th className="font-normal">Minutes</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td className="tabular-nums">{d.minutes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Minutes per day over the last 14 days, up to ${max} minutes`}>
          {[0, max].map((m) => (
            <g key={m}>
              <line x1={pad.l} x2={W} y1={y(m)} y2={y(m)} stroke="#e9ecef" />
              <text x={pad.l - 4} y={y(m) + 4} fontSize="10" textAnchor="end" fill="#868e96">
                {m}
              </text>
            </g>
          ))}
          {daily.map((d, i) => {
            const x = pad.l + i * step + 2;
            const w = step - 4;
            const top = y(d.minutes);
            return (
              <g key={d.date} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                {/* A tall invisible hit target, bigger than the bar. */}
                <rect x={pad.l + i * step} y={pad.t} width={step} height={H - pad.b - pad.t} fill="transparent" />
                {d.minutes > 0 && <path d={`M${x} ${H - pad.b} V${top + 4} q0 -4 4 -4 h${w - 8} q4 0 4 4 V${H - pad.b} Z`} fill={BAR} />}
                <text x={x + w / 2} y={H - 6} fontSize="10" textAnchor="middle" fill="#868e96">
                  {day(d.date)}
                </text>
                {hover === i && (
                  <text x={x + w / 2} y={Math.max(pad.t + 8, top - 4)} fontSize="11" textAnchor="middle" fill="#2b2b2b" fontWeight="bold">
                    {d.minutes} min
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      <button type="button" onClick={() => setTable((t) => !t)} className="mt-2 min-h-12 text-sm text-ink/60 underline">
        {table ? 'Show chart' : 'Show as table'}
      </button>
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3">
      <span>{label}</span>
      <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="size-6 accent-[#f59f00]" />
    </label>
  );
}

function SettingsPanel() {
  const { settings, update } = useSettings();
  const download = () => {
    const blob = new Blob([reminderIcs(settings.reminder, new Date())], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hanzi-garden-reminder.ics';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <Card title="Settings">
      <div className="flex flex-col divide-y divide-[#f1ece0]">
        <Toggle label="Show pinyin" on={settings.showPinyin} set={(v) => update({ showPinyin: v })} />
        <Toggle label="Show English" on={settings.showEnglish} set={(v) => update({ showEnglish: v })} />
        <Toggle label="Sounds" on={settings.sounds} set={(v) => update({ sounds: v })} />
        <Toggle label="Vibration" on={settings.haptics} set={(v) => update({ haptics: v })} />
        <label className="flex min-h-12 items-center justify-between gap-3">
          <span>Daily limit</span>
          <select value={settings.dailyLimitMin} onChange={(e) => update({ dailyLimitMin: Number(e.target.value) })} className="min-h-12 rounded-xl bg-[#fdf6e3] px-2">
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-12 items-center justify-between gap-3">
          <span>Writing practice</span>
          <select value={settings.writing} onChange={(e) => update({ writing: e.target.value as 'younger' | 'older' })} className="min-h-12 rounded-xl bg-[#fdf6e3] px-2">
            <option value="younger">Ages 5–7 (more forgiving)</option>
            <option value="older">Ages 8–10</option>
          </select>
        </label>
        <p className="py-2 text-xs text-ink/50">Tracing leniency is {leniencyFor(settings)}.</p>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 py-2">
          <label htmlFor="reminder">Daily reminder</label>
          <span className="flex items-center gap-2">
            <input id="reminder" type="time" value={settings.reminder} onChange={(e) => update({ reminder: e.target.value })} className="min-h-12 rounded-xl bg-[#fdf6e3] px-2" />
            <button type="button" onClick={download} disabled={!settings.reminder} className="min-h-12 rounded-xl bg-[#ffe8a3] px-3 disabled:opacity-40">
              Add to calendar
            </button>
          </span>
        </div>
        <p className="py-2 text-xs text-ink/50">
          Web apps can't wake a closed phone, so the reminder is a repeating event for your own calendar. Simplified characters are used; a Traditional
          option is planned.
        </p>
      </div>
    </Card>
  );
}

function DataPanel() {
  const { profiles, reload, choose } = useProfile();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportAll = async () => {
    const blob = new Blob([JSON.stringify(await store.exportAll(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hanzi-garden-${localDate(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importAll = async (f: File) => {
    if (!confirm('Replace all progress on this device with this file?')) return;
    try {
      await store.importAll(JSON.parse(await f.text()));
      await reload();
      choose(null);
      setMessage('Progress imported.');
    } catch (err) {
      setMessage(`That file couldn't be imported: ${(err as Error).message}`);
    }
  };

  const remove = async (id: number, animal: string) => {
    if (!confirm(`Delete ${animal} and all their progress? This can't be undone.`)) return;
    await store.deleteProfile(id);
    await reload();
    choose(null);
  };

  return (
    <Card title="Data">
      <p className="mb-3 text-sm text-ink/60">All progress stays on this device. Nothing is uploaded.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={exportAll} className="min-h-12 rounded-xl bg-[#ffe8a3] px-3">
          Export (JSON)
        </button>
        <button type="button" onClick={() => file.current?.click()} className="min-h-12 rounded-xl bg-[#fdf6e3] px-3">
          Import
        </button>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])} />
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
      {profiles && profiles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button key={p.id} type="button" onClick={() => remove(p.id!, p.animal)} className="min-h-12 rounded-xl border border-[#ffc9c9] px-3 text-sm">
              Delete {p.animal}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
