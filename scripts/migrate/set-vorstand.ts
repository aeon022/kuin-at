/**
 * One-off: replace the six "Vorstandsmitglied N" placeholders in `people` with the
 * real board (Vereinsregisterauszug 06.02.2024, Funktionsperiode 18.12.2023–17.12.2026;
 * Astrid Kury replaced by Angela Fink per client, 2026-10-01). Keeps the placeholder
 * photo; real photos are added via the Orbiter admin. Display order is set in
 * src/pages/der-verein/vorstand.astro (ROLE_ORDER), not via sort_order.
 * Run: ORBITER_POD=... node scripts/migrate/set-vorstand.ts
 */
import { openPod } from '@a83/orbiter-core';

const BOARD = [
  { from: 'vorstand-platzhalter-1', slug: 'sibylle-dienesch', name: 'Mag. Sibylle Dienesch', role: 'Obfrau' },
  { from: 'vorstand-platzhalter-2', slug: 'matthias-grasser', name: 'Matthias Grasser', role: 'Obfrau-Stellvertreter' },
  { from: 'vorstand-platzhalter-3', slug: 'susanne-maurer-aldrian', name: 'Mag. Susanne Maurer-Aldrian', role: 'Kassierin' },
  { from: 'vorstand-platzhalter-4', slug: 'ursula-vennemann', name: 'Ursula Vennemann', role: 'Kassierin-Stellvertreterin' },
  { from: 'vorstand-platzhalter-5', slug: 'angela-fink', name: 'Angela Fink', role: 'Schriftführerin' },
  { from: 'vorstand-platzhalter-6', slug: 'gerwin-weiher', name: 'Gerwin Weiher', role: 'Schriftführerin-Stellvertreter' },
];

const db = openPod(process.env.ORBITER_POD || './content.pod');
for (const b of BOARD) {
  const e = db.getEntry('people', b.from);
  if (!e) { console.log(`skip ${b.from} — not found`); continue; }
  const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
  db.updateEntry('people', b.from, { slug: b.slug, data: { ...data, name: b.name, role: b.role } });
  console.log(`${b.from} -> ${b.slug} (${b.name}, ${b.role})`);
}
db.close();
