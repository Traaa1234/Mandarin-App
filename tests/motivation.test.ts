import { describe, expect, it } from 'vitest';
import { adapt, START } from '../src/practice/adaptive';
import { reminderIcs } from '../src/practice/ics';
import { sunshineStreak, weekSuns } from '../src/practice/streak';

const days = (...d: string[]) => new Set(d);
const at = (d: string) => new Date(`${d}T18:00:00`);

describe('Sunshine streak', () => {
  it('counts days in a row', () => {
    expect(sunshineStreak(days('2026-10-21', '2026-10-22', '2026-10-23'), at('2026-10-23'))).toBe(3);
  });
  it('is not reset by missing 1 or 2 days', () => {
    // Mon–Wed practised, Thu and Fri missed, Sat practised.
    const d = days('2026-10-26', '2026-10-27', '2026-10-28', '2026-10-31');
    expect(sunshineStreak(d, at('2026-10-31'))).toBe(4);
    expect(sunshineStreak(days('2026-10-26', '2026-10-28'), at('2026-10-28'))).toBe(2);
  });
  it('ends after a third missed day in the same week', () => {
    const d = days('2026-10-26', '2026-10-30');
    expect(sunshineStreak(d, at('2026-10-30'))).toBe(1);
  });
  it('gives each week its own two rest days', () => {
    // Fri 23 + Mon 26 practised; Sat 24, Sun 25 (last week) rest; Tue 27 (this week) rest.
    expect(sunshineStreak(days('2026-10-23', '2026-10-26', '2026-10-28'), at('2026-10-28'))).toBe(3);
  });
  it('does not count today against the streak before playing', () => {
    expect(sunshineStreak(days('2026-10-26', '2026-10-27'), at('2026-10-28'))).toBe(2);
  });
  it('lights a sun for each day practised this week', () => {
    expect(weekSuns(days('2026-10-26', '2026-10-28'), at('2026-10-29'))).toEqual([true, false, true, false, false, false, false]);
  });
});

describe('adaptive difficulty', () => {
  const miss = { retries: 1, helped: false, ms: 5000 };
  const quick = { retries: 0, helped: false, ms: 1500 };
  const slow = { retries: 0, helped: false, ms: 6000 };
  it('offers an easier version after 2 misses in a row', () => {
    expect(adapt(adapt(START, miss), miss).level).toBe('easier');
    expect(adapt(START, miss).level).toBe('normal');
  });
  it('raises the challenge after 5 quick right answers', () => {
    let s = START;
    for (let i = 0; i < 4; i++) s = adapt(s, quick);
    expect(s.level).toBe('normal');
    expect(adapt(s, quick).level).toBe('harder');
  });
  it('goes back to normal after a right answer when easier', () => {
    const easier = adapt(adapt(START, miss), miss);
    expect(adapt(easier, slow).level).toBe('normal');
  });
});

describe('reminder calendar file', () => {
  it('repeats daily at the chosen time', () => {
    const ics = reminderIcs('17:30', new Date('2026-10-26T09:00:00'));
    expect(ics).toContain('DTSTART:20261026T173000');
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
  });
});

describe('rewards', async () => {
  const { BADGES, fixedTricky, pickGift, GIFT_STICKERS } = await import('../src/practice/rewards');
  it('counts a character as fixed once a failed card is passed later', () => {
    const t = (h: number) => new Date(2026, 9, 26, h);
    expect(fixedTricky([{ char: '人', kind: 'see', rating: 1, at: t(9) }, { char: '人', kind: 'see', rating: 3, at: t(10) }])).toBe(1);
    expect(fixedTricky([{ char: '人', kind: 'see', rating: 3, at: t(9) }, { char: '人', kind: 'see', rating: 1, at: t(10) }])).toBe(0);
  });
  it('gives a new sticker first, then shop items, then seeds', () => {
    expect(pickGift(new Set(), () => 0).item).toBe(`sticker:${GIFT_STICKERS[0]}`);
    const allStickers = new Set(GIFT_STICKERS.map((s) => `sticker:${s}`));
    expect(pickGift(allStickers, () => 0).item).toMatch(/^(decor|outfit):/);
  });
  it('rewards effort and variety', () => {
    const none = { learned: 0, toneReviews: 0, daysThisWeek: 0, fixedTricky: 0, games: 0, phrasesSaid: 0, dragon: false, taught: 0, islandsDone: 0 };
    expect(BADGES.filter((b) => b.earned(none))).toEqual([]);
    expect(BADGES.filter((b) => b.earned({ ...none, daysThisWeek: 3, toneReviews: 10 })).map((b) => b.label)).toEqual([
      'Tried 10 tones',
      'Practised 3 days this week',
    ]);
  });
});
