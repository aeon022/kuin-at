// One-off: create the real `archive` collection entry for the walk whose
// photos ArchiveGallery.astro already links to on the homepage.
//
// Traced in the WP SQL export (wp_9bhnv_2026-09-14_13-30-44.sql): all 136
// "Foto-*.jpg" media items were uploaded to uploads/2025/02 as one gallery
// block inside the post that became blog/kuin-spaziergang — "Der dritte
// inklusive Spaziergang des Vereins Kultur Inklusiv", 12. Jänner 2025,
// 4 Stationen (Mezzanin Theater, Kunsthaus Graz, GrazMuseum, Die Brücke),
// photographed by Edi Haberl. None of these images have real alt text —
// confirmed `alt=""` in the original WP export too, not lost in migration —
// so alt_text is the same "[TODO: ... ergänzen]" placeholder used elsewhere
// in this codebase rather than invented descriptions. No per-image caption
// is set for the same reason (the schema marks `caption` optional).
import { openPod } from '@a83/orbiter-core';

const SLUG = '3-spaziergang-2025';
const db = openPod('./content.pod');

if (db.getEntry('archive', SLUG)) {
  console.log('already exists, skipping');
} else {
  const photos = db
    .listMedia()
    .filter((m: { filename: string }) => /^Foto-?\d*\.jpg$/.test(m.filename))
    .sort((a: { filename: string }, b: { filename: string }) => {
      const numOf = (f: string) => Number(f.match(/\d+/)?.[0] ?? '0');
      return numOf(a.filename) - numOf(b.filename);
    });

  db.createEntry('archive', SLUG, {
    title: '3. Spaziergang',
    year: 2025,
    description:
      'Der dritte inklusive Spaziergang des Vereins Kultur Inklusiv, 12. Jänner 2025: ' +
      'mehr als 50 Gäste besuchten 4 Stationen in Graz — Mezzanin Theater, Kunsthaus Graz, ' +
      'GrazMuseum und Die Brücke. Fotos: Edi Haberl.',
    images: photos.map((m: { id: string }) => ({
      image_url: `/orbiter/media/${m.id}`,
      alt_text: '[ALT-TEXT TODO: Bild manuell beschreiben]',
    })),
  }, 'published');
  console.log(`created archive/${SLUG} with ${photos.length} images`);
}

db.close();
