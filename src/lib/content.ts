export function getDisplayContent<T extends Record<string, unknown>>(
  entry: T,
  standardKey: keyof T,
  leichtLesenKey: keyof T,
  leichtLesenActive: boolean,
): string {
  const standard = String(entry[standardKey] ?? '');
  if (!leichtLesenActive) return standard;
  const leicht = entry[leichtLesenKey];
  return typeof leicht === 'string' && leicht.trim().length > 0 ? leicht : standard;
}
