import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import ToneShape from '../../components/ToneShape';
import { playKeys } from '../../lib/audio';
import { boop, buzz, chime } from '../../lib/sfx';
import { toneClass } from '../../lib/tones';
import { content, type Rule } from './content';
import { Stars } from './ui';

// The animated example for each rule: what is written turns into what is said.
const DEMOS: Record<string, { from: string; to: string; say: string; tones?: [number[], number[]] }> = {
  mark: { from: 'hao ˇ', to: 'hǎo', say: 'hao3' },
  'u-dots': { from: 'j + ü', to: 'ju', say: 'ju1' },
  'third-third': { from: 'nǐ hǎo', to: 'ní hǎo', say: 'ni2 hao3', tones: [[3, 3], [2, 3]] },
  bu: { from: 'bù shì', to: 'bú shì', say: 'bu2 shi4' },
  yi: { from: 'yī gè', to: 'yí gè', say: 'yi2 ge4' },
};

export default function RulesPage() {
  const [open, setOpen] = useState<Rule | null>(null);

  if (open) return <RuleCard key={open.id} rule={open} onDone={() => setOpen(null)} />;

  return (
    <ol className="flex flex-col gap-3">
      {content.rules.map((rule, i) => (
        <li key={rule.id}>
          <button
            type="button"
            onClick={() => setOpen(rule)}
            className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm active:scale-[0.98]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ffe8a3] text-xl font-bold">
              {i + 1}
            </span>
            <span className="text-3xl font-semibold">
              <Colored text={DEMOS[rule.id].to} />
            </span>
            <span className="ml-auto text-sm text-ink/70">{rule.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

// Each syllable in its tone's color.
function Colored({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /\s/.test(part) || !/[a-zü]/i.test(part) ? (
          <span key={i}>{part}</span>
        ) : (
          <span key={i} className={toneClass(part)}>
            {part}
          </span>
        ),
      )}
    </>
  );
}

function RuleDemo({ ruleId }: { ruleId: string }) {
  const demo = DEMOS[ruleId];
  const [after, setAfter] = useState(false);

  // Show the written form, then turn it into the spoken one.
  const play = () => {
    setAfter(false);
    setTimeout(() => {
      setAfter(true);
      playKeys(demo.say.split(' '));
    }, 900);
  };
  useEffect(() => {
    play();
    // Runs once per rule; play only reads that rule's demo.
  }, [ruleId]);

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Example: ${demo.from} becomes ${demo.to}`}
      className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-3xl bg-white p-4 shadow-md"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={after ? 'to' : 'from'}
          initial={{ opacity: 0, y: after ? 20 : 0, scale: after ? 1.2 : 1 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-6xl font-semibold"
        >
          <Colored text={after ? demo.to : demo.from} />
        </motion.span>
      </AnimatePresence>
      {demo.tones && (
        <span className="flex gap-2">
          {(after ? demo.tones[1] : demo.tones[0]).map((t, i) => (
            <ToneShape key={`${after}-${i}`} tone={t} width={70} />
          ))}
        </span>
      )}
    </button>
  );
}

function RuleCard({ rule, onDone }: { rule: Rule; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [stars, setStars] = useState(0);
  const [missed, setMissed] = useState(false);
  const [wobble, setWobble] = useState<string | null>(null);
  const item = rule.practice[step];

  // The mark rule's prompts are recordings themselves (hao3); the others carry 'say'.
  const say = item ? (item.say ?? item.prompt).split(' ') : [];
  const canSay = item && (item.say || /^[a-z]+[1-5]$/.test(item.prompt));

  const choose = (choice: string) => {
    if (choice === item.answer) {
      chime();
      buzz();
      if (!missed) setStars((s) => s + 1);
      setMissed(false);
      if (canSay) playKeys(say);
      setTimeout(() => setStep((s) => s + 1), 700);
    } else {
      boop();
      setMissed(true);
      setWobble(choice);
      setTimeout(() => setWobble(null), 400);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <RuleDemo ruleId={rule.id} />
      <p className="max-w-sm text-center text-sm text-ink/70">{rule.explain}</p>

      {item ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-3xl bg-[#fff9db] p-4">
          <p className="text-sm text-ink/70">
            {step + 1} / {rule.practice.length}
          </p>
          <div className="flex items-center gap-3">
            <span lang="zh-Hans" className="han text-5xl font-semibold">{item.prompt}</span>
            {canSay && (
              <button
                type="button"
                onClick={() => playKeys(say)}
                aria-label="Listen"
                className="flex size-14 items-center justify-center rounded-full bg-white text-2xl shadow-md active:scale-95"
              >
                🔊
              </button>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {item.choices.map((c) => (
              <motion.button
                key={c}
                type="button"
                onClick={() => choose(c)}
                animate={wobble === c ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="min-h-16 min-w-28 rounded-2xl bg-white px-4 text-4xl font-semibold shadow-md active:scale-95"
              >
                <Colored text={c} />
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <p lang="zh-Hans" className="han text-3xl">
            <span className="block text-base">tài bàng le</span>太棒了！
          </p>
          <Stars count={stars} of={rule.practice.length} />
          <button
            type="button"
            onClick={onDone}
            aria-label="Back to the rules"
            className="flex min-h-16 min-w-16 items-center justify-center rounded-2xl bg-white px-4 text-3xl shadow-md active:scale-95"
          >
            📏
          </button>
        </div>
      )}
    </div>
  );
}
