// A calendar file with a daily practice reminder, for platforms without local
// notifications. The parent adds it to their own calendar; nothing is sent anywhere.
export function reminderIcs(time: string, start: Date, uid = 'hanzi-garden-daily-reminder'): string {
  const [h, m] = time.split(':').map(Number);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}`;
  const at = `${day}T${pad(h)}${pad(m)}00`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hanzi Garden//Reminder//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${day}T000000Z`,
    `DTSTART:${at}`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Hanzi Garden time 🌱',
    'DESCRIPTION:Time for today\'s adventure with Bǎobao.',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Hanzi Garden time',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
