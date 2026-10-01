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

// Day / weekday / month in Vienna time (the server may run in another TZ).
const part = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat('de-AT', { timeZone: 'Europe/Vienna', ...opts }).format(d);

export function dateParts(start: string | Date) {
  const d = new Date(start);
  return {
    day: part({ day: 'numeric' }, d),
    weekday: part({ weekday: 'long' }, d),
    month: part({ month: 'long' }, d),
    year: part({ year: 'numeric' }, d),
    // sortable key for grouping by month
    monthKey: part({ year: 'numeric', month: '2-digit' }, d),
  };
}

// An event is over once its end has passed; open-ended ones (end <= start) count until the end of that day.
export function isPast(start: string | Date, end: string | Date, now = Date.now()) {
  const s = new Date(start).getTime(), e = new Date(end).getTime();
  return (e > s ? e : s + 24 * 3600 * 1000) < now;
}
