/**
 * One-off (2026-10-01): unpublish the empty legacy WordPress shells `galerie` and
 * `veranstaltungen` (pages). Draft, not deleted. /events is the real events section.

 * Other entries: COLLECTION=blog SLUGS=programm-2026 (2026-10-01, not a newsletter); SLUGS=kuin (2026-10-01, legacy logo + manifest link page).
 * Run: ORBITER_POD=... node scripts/migrate/unpublish-galerie-veranstaltungen.ts
 */
import { openPod } from '@a83/orbiter-core';

const COL = process.env.COLLECTION ?? 'pages';
const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const slug of (process.env.SLUGS ?? 'galerie,veranstaltungen').split(',')) {
  const e = db.getEntry(COL, slug);
  if (!e) { console.log(`skip ${COL}/${slug} — not found`); continue; }
  db.updateEntry(COL, slug, { status: 'draft' });
  console.log(`unpublished ${COL}/${slug} (was ${e.status})`);
}
db.close();
