/**
 * One-off (2026-10-02): echte Teammitglieder statt der Platzhalter "Teammitglied 1/2"
 * (die werden unveröffentlicht, nicht gelöscht). Foto = das gemeinsame Platzhalterfoto.
 * Rolle noch offen -> "Teammitglied" (im Admin nachziehen).
 * Idempotent. Run: ORBITER_POD=... node --import tsx scripts/migrate/add-team-members.ts
 */
import { openPod } from '@a83/orbiter-core';

const PHOTO = 'bcd9cb58-429f-4354-ba9e-ef88dac97787';
const MEMBERS = [
  { slug: 'anita-brodtrager', name: 'Anita Brodtrager', placeholder: 'team-platzhalter-1' },
  { slug: 'ed-haberl', name: 'Ed Haberl', placeholder: 'team-platzhalter-2' },
];

const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const m of MEMBERS) {
  if (db.getEntry('people', m.slug)) { console.log(`skip ${m.slug} — exists`); continue; }
  db.createEntry('people', m.slug, { name: m.name, role: 'Teammitglied', category: 'team', photo: PHOTO, social_links: [] }, 'published');
  console.log(`created people/${m.slug}`);
  if (db.getEntry('people', m.placeholder)) {
    db.updateEntry('people', m.placeholder, { status: 'draft' });
    console.log(`unpublished people/${m.placeholder}`);
  }
}
db.close();
