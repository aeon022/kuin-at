/**
 * One-off (2026-10-01): "Newsletter Oktober bis Dezember 2026" as a blog entry (the
 * blog collection is the newsletter archive), same markup as the other newsletter posts.
 * Run: ORBITER_POD=... node scripts/migrate/add-newsletter-2026-q4.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const SLUG = 'newsletter-oktober-bis-dezember-2026';
const db = openPod(process.env.ORBITER_POD || './content.pod');
if (db.getEntry('blog', SLUG)) { console.log('skip — exists'); process.exit(0); }

const file = 'KUIN-NEWSLETTER-OKTOBER-DEZEMBER-2026.pdf';
const buf = readFileSync(`import-source/mail/${file}`);
const id = randomUUID();
db.insertMedia(id, file, 'application/pdf', buf.length, buf, null);
const url = `/orbiter/media/${id}`;
const label = 'KUIN NEWSLETTER OKTOBER-DEZEMBER 2026';

db.createEntry('blog', SLUG, {
  title: 'Newsletter Oktober bis Dezember 2026',
  published_at: new Date().toISOString(),
  cover_image: '',
  content_standard:
    `<div class="wp-block-file"><object class="wp-block-file__embed" data="${url}" type="application/pdf" style="width:100%;height:600px" aria-label="${label}"></object>` +
    `<a id="nl-q4-2026" href="${url}">${label}</a>` +
    `<a href="${url}" class="wp-block-file__button wp-element-button" download aria-describedby="nl-q4-2026">Herunterladen</a></div>`,
}, 'published');
console.log(`added blog/${SLUG} (media ${id}, ${buf.length} bytes)`);
db.close();
