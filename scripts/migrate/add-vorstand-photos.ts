/**
 * One-off (2026-10-04): Porträtfotos für Vorstandsmitglieder statt des gemeinsamen Platzhalterfotos.
 * Fotos: (c) Edi Haberl, quadratisch zugeschnitten (800x800 JPEG, progressive) aus "# assets/fotos/vorstand/".
 * Platzhalter-Media bleibt bestehen (wird von anderen Personen noch genutzt). Idempotent.
 * Run: ORBITER_POD=... node --import tsx scripts/migrate/add-vorstand-photos.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const PEOPLE: Record<string, string> = {
  'gerwin-weiher': 'Gerwin Weiher',
  'matthias-grasser': 'Matthias Grasser',
  'sibylle-dienesch': 'Mag.a Sibylle Dienesch',
  'ursula-vennemann': 'Ursula Vennemann',
};

const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const [slug, name] of Object.entries(PEOPLE)) {
  const e = db.getEntry('people', slug);
  if (!e) { console.log(`skip ${slug} — not found`); continue; }
  if (db.getMediaItem(e.data.photo)?.filename === `${slug}.jpg`) { console.log(`skip ${slug} — already has photo`); continue; }
  const buf = readFileSync(`scripts/migrate/assets/vorstand/${slug}.jpg`);
  const id = randomUUID();
  db.insertMedia(id, `${slug}.jpg`, 'image/jpeg', buf.length, buf, `Porträt von ${name}`);
  db.updateEntry('people', slug, { data: { ...e.data, photo: id } });
  console.log(`${slug}: photo -> ${id} (${buf.length} bytes)`);
}
db.close();
