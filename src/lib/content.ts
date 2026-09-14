/**
 * Parse a whole Orbiter collection, skipping (and logging) entries whose data
 * doesn't match the schema — one bad CMS entry must not take down a listing
 * page. Keeps the entry slug alongside the parsed data.
 */
export function parseEntries<T>(
  collectionId: string,
  entries: { slug: string; data: unknown }[],
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: unknown } },
): { slug: string; data: T }[] {
  const result: { slug: string; data: T }[] = [];
  for (const entry of entries) {
    const parsed = schema.safeParse(entry.data);
    if (parsed.success) result.push({ slug: entry.slug, data: parsed.data });
    else console.warn(`${collectionId}/${entry.slug}: invalid entry data, skipped`, parsed.error);
  }
  return result;
}

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
