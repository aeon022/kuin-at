// One-off: register the "people" collection — real people (Vorstand +
// Team), distinct from `partners` (organizations: logo, not photo; no
// role/bio/social fields). Client request 2026-09: a Vorstand sub-page
// under Über uns with photo/name/role/social links/short bio, plus a
// parallel Team sub-page — same shape for both, split by `category`.
// No entries yet — Anita adds real people via the Orbiter admin.
import { openPod } from '@a83/orbiter-core';

const db = openPod('./content.pod');

if (db.getCollection('people')) {
  console.log('collection "people" already exists, skipping');
} else {
  db.createCollection('people', 'Team & Vorstand', {
    name: { type: 'string', label: 'Name', required: true },
    role: { type: 'string', label: 'Funktion', required: true },
    category: { type: 'string', label: 'Kategorie ("vorstand" oder "team")', required: true },
    photo: { type: 'image', label: 'Foto', required: true },
    bio: { type: 'string', label: 'Kurzprofil' },
    social_links: { type: 'array', label: 'Social Links (JSON: label, url)' },
  });
  console.log('created collection "people"');
}

db.close();
