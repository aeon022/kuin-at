// "15:00–17:15 Uhr" in Vienna time. Two conventions because Orbiter needs both datetimes:
//  - start exactly 00:00      → "date known, time not yet announced": no time shown
//  - end equal to / before start → "open end": "ab 09:30 Uhr"
// so unknown times are never made up.
const fmt = new Intl.DateTimeFormat('de-AT', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function formatTimeRange(start: string | Date, end: string | Date): string {
  const s = fmt.format(new Date(start));
  if (s === '00:00') return '';
  if (new Date(end).getTime() <= new Date(start).getTime()) return `ab ${s} Uhr`;
  return `${s}–${fmt.format(new Date(end))} Uhr`;
}
