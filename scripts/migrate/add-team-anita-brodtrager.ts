/**
 * One-off (2026-10-02): Anita Brodtrager ins Team; ersetzt den Platzhalter "Teammitglied 1"
 * (der wird unveröffentlicht, nicht gelöscht). Foto = das gemeinsame Platzhalterfoto.
 * Rolle noch offen -> "Teammitglied" (im Admin nachziehen).
 * Idempotent. Run: ORBITER_POD=... node --import tsx scripts/migrate/add-team-anita-brodtrager.ts
 */
import { openPod } from '@a83/orbiter-core';

const db = openPod(process.env.ORBITER_POD || './content.pod');
if (db.getEntry('people', 'anita-brodtrager')) {
  console.log('skip — anita-brodtrager already exists');
} else {
  db.createEntry('people', 'anita-brodtrager', {
    name: 'Anita Brodtrager',
    role: 'Teammitglied',
    category: 'team',
    photo: 'bcd9cb58-429f-4354-ba9e-ef88dac97787',
    social_links: [],
  }, 'published');
  console.log('created people/anita-brodtrager');
  if (db.getEntry('people', 'team-platzhalter-1')) {
    db.updateEntry('people', 'team-platzhalter-1', { status: 'draft' });
    console.log('unpublished people/team-platzhalter-1');
  }
}
db.close();
