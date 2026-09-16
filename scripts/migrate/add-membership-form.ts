// One-off: the "downloads" collection was completely empty. Found in the WP
// export (Oxygen "Mitgliedschaft" section, wp_9bhnv_2026-09-14_13-30-44.sql):
// a real "Antrag Mitgliedschaft" button linking to
// KUIN-Beitrittsformular-Mitgliedschaft-2025.pdf — already uploaded to
// Orbiter media (id 00a17e68-dfe1-4ff3-8eda-77c4cf8656ff) but never linked
// into a Downloads entry, so "Mitglied werden" links across the site had
// nowhere real to point.
import { openPod } from '@a83/orbiter-core';

const SLUG = 'beitrittsformular-mitgliedschaft-2025';
const db = openPod('./content.pod');

if (db.getEntry('downloads', SLUG)) {
  console.log('already exists, skipping');
} else {
  db.createEntry('downloads', SLUG, {
    title: 'Beitrittsformular Mitgliedschaft 2025',
    file: '00a17e68-dfe1-4ff3-8eda-77c4cf8656ff',
    description: 'Antrag auf Mitgliedschaft beim Verein Kultur Inklusiv.',
  }, 'published');
  console.log(`created downloads/${SLUG}`);
}

db.close();
