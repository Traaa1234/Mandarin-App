import { useState } from 'react';

// A simple parent gate: a multiplication a young child can't do, typed on a number pad.
export default function ParentGate({ onPass, onCancel }: { onPass: () => void; onCancel: () => void }) {
  const [q] = useState(() => [6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)] as const);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);

  const press = (d: string) => {
    const next = (typed + d).slice(0, 3);
    setTyped(next);
    setWrong(false);
    if (next.length >= String(q[0] * q[1]).length) {
      if (Number(next) === q[0] * q[1]) onPass();
      else {
        setWrong(true);
        setTyped('');
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4" role="dialog" aria-label="For grown-ups">
      <p className="text-lg font-bold">For grown-ups</p>
      <p className="text-3xl tabular-nums">
        {q[0]} × {q[1]} = <span className="inline-block min-w-16 border-b-2 border-ink/30">{typed}</span>
      </p>
      {wrong && <p className="text-sm text-ink/60">Not quite, try again.</p>}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''].map((d, i) =>
          d ? (
            <button key={i} type="button" onClick={() => press(d)} className="size-16 rounded-2xl bg-white text-2xl shadow-md active:scale-95">
              {d}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      <button type="button" onClick={onCancel} className="min-h-14 rounded-2xl px-4 text-ink/60 underline">
        Cancel
      </button>
    </div>
  );
}
