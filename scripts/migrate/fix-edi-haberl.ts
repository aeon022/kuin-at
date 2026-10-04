/**
 * One-off (2026-10-04): Teammitglied heißt "Edi Haberl" (nicht "Ed"), Funktion "Fotos, Videos". Idempotent.
 * Run: ORBITER_POD=... node --import tsx scripts/migrate/fix-edi-haberl.ts
 */
import { openPod } from '@a83/orbiter-core';

const db = openPod(process.env.ORBITER_POD || './content.pod');
const e = db.getEntry('people', 'ed-haberl');
if (!e) console.log('skip — ed-haberl not found');
else {
  const data = { ...e.data, name: 'Edi Haberl', role: 'Fotos, Videos' };
  db.updateEntry('people', 'ed-haberl', { data });
  console.log(`ed-haberl: "${e.data.name}" / "${e.data.role}" -> "${data.name}" / "${data.role}"`);
}
db.close();
