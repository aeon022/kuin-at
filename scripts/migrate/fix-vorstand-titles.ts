/**
 * One-off (2026-10-02): akademische Titel der Vorstandsmitglieder ("Mag.a", weiblich).
 * Die Seite setzt das "a" hoch (PersonCard.astro). Idempotent.
 * Run: ORBITER_POD=... node --import tsx scripts/migrate/fix-vorstand-titles.ts
 */
import { openPod } from '@a83/orbiter-core';

const NAMES: Record<string, string> = {
  'sibylle-dienesch': 'Mag.a Sibylle Dienesch',
  'susanne-maurer-aldrian': 'Mag.a Susanne Maurer-Aldrian',
  'angela-fink': 'Mag.a Angela Fink, MA',
};

const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const [slug, name] of Object.entries(NAMES)) {
  const e = db.getEntry('people', slug);
  if (!e) { console.log(`skip ${slug} — not found`); continue; }
  if (e.data.name === name) { console.log(`skip ${slug} — already "${name}"`); continue; }
  db.updateEntry('people', slug, { data: { ...e.data, name } });
  console.log(`${slug}: "${e.data.name}" -> "${name}"`);
}
db.close();
