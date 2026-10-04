/**
 * One-off (2026-10-04): Titel Teammitglied Anita Brodtrager ("Mag.a ..., BA"), Rolle "Teammitglied". Idempotent.
 * Run: ORBITER_POD=... node --import tsx scripts/migrate/fix-team-titles.ts
 */
import { openPod } from '@a83/orbiter-core';

const db = openPod(process.env.ORBITER_POD || './content.pod');
const e = db.getEntry('people', 'anita-brodtrager');
if (!e) console.log('skip — anita-brodtrager not found');
else {
  const data = { ...e.data, name: 'Mag.a Anita Brodtrager, BA', role: 'Teammitglied' };
  db.updateEntry('people', 'anita-brodtrager', { data });
  console.log(`anita-brodtrager: "${e.data.name}" / "${e.data.role}" -> "${data.name}" / "${data.role}"`);
}
db.close();
