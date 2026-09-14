import { createPod } from '@a83/orbiter-core';

export function createKuinCollections(podPath: string): void {
  const db = createPod(podPath, {
    site: { name: 'Kultur Inklusiv Graz', description: 'Kunst und Kultur barrierefrei erleben.', locale: 'de' },
  });

  db.createCollection('pages', 'Seiten', {
    title: { type: 'string', label: 'Titel', required: true },
    content_standard: { type: 'richtext', label: 'Inhalt (Standard)', required: true },
    content_leicht_lesen: { type: 'richtext', label: 'Inhalt (Leicht Lesen)' },
    seo_description: { type: 'string', label: 'SEO-Beschreibung' },
  });

  db.createCollection('events', 'Veranstaltungen', {
    title: { type: 'string', label: 'Titel', required: true },
    start_date: { type: 'datetime', label: 'Start', required: true },
    end_date: { type: 'datetime', label: 'Ende', required: true },
    location: { type: 'string', label: 'Ort / Treffpunkt', required: true },
    description_standard: { type: 'richtext', label: 'Beschreibung (Standard)', required: true },
    description_leicht_lesen: { type: 'richtext', label: 'Beschreibung (Leicht Lesen)' },
    accessibility_features: { type: 'array', label: 'Barrierefreiheits-Merkmale' },
    gallery_id: { type: 'relation', label: 'Galerie', relationTo: 'archive' },
  });

  db.createCollection('blog', 'Blog', {
    title: { type: 'string', label: 'Titel', required: true },
    published_at: { type: 'datetime', label: 'Veröffentlicht', required: true },
    cover_image: { type: 'image', label: 'Titelbild' },
    content_standard: { type: 'richtext', label: 'Inhalt (Standard)', required: true },
    content_leicht_lesen: { type: 'richtext', label: 'Inhalt (Leicht Lesen)' },
  });

  db.createCollection('archive', 'Archiv / Rückblicke', {
    title: { type: 'string', label: 'Titel', required: true },
    year: { type: 'number', label: 'Jahr', required: true },
    description: { type: 'string', label: 'Beschreibung' },
    images: { type: 'array', label: 'Bilder (JSON: image_url, alt_text, caption)' },
  });

  db.createCollection('partners', 'Partner & Mitglieder', {
    name: { type: 'string', label: 'Name', required: true },
    logo: { type: 'image', label: 'Logo', required: true },
    website_url: { type: 'url', label: 'Website' },
    description: { type: 'string', label: 'Beschreibung' },
    is_board_member: { type: 'boolean', label: 'Vorstandsmitglied' },
  });

  db.createCollection('downloads', 'Downloads', {
    title: { type: 'string', label: 'Titel', required: true },
    file: { type: 'media', label: 'Datei', required: true },
    description: { type: 'string', label: 'Beschreibung' },
  });

  db.close();
}
