import Baobao from '../components/Baobao';

// A shortcut to today's adventure, for screens that stay empty until the child
// has learned something there.
export default function TodayButton({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => (window.location.hash = '/today')}
        aria-label="Today's adventure"
        className="flex min-h-20 items-center justify-center gap-3 rounded-3xl bg-[#f59f00] px-6 text-ink shadow-md active:scale-95"
      >
        <Baobao size={56} mood="happy" />
        <span lang="zh-Hans" className="han text-3xl font-bold">
          <span className="py block text-sm font-normal">jīntiān</span>今天
        </span>
      </button>
      <p className="en max-w-xs text-center text-sm text-ink/70">{hint}</p>
    </div>
  );
}
