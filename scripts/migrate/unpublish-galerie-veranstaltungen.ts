/**
 * One-off (2026-10-01): unpublish the empty legacy WordPress shells `galerie` and
 * `veranstaltungen` (pages). Draft, not deleted. /events is the real events section.
 * Run: ORBITER_POD=... node scripts/migrate/unpublish-galerie-veranstaltungen.ts
 */
import { openPod } from '@a83/orbiter-core';

const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const slug of ['galerie', 'veranstaltungen']) {
  const e = db.getEntry('pages', slug);
  if (!e) { console.log(`skip pages/${slug} — not found`); continue; }
  db.updateEntry('pages', slug, { status: 'draft' });
  console.log(`unpublished pages/${slug} (was ${e.status})`);
}
db.close();
