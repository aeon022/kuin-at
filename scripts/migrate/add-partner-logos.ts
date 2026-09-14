/**
 * One-off: add partners whose logo file arrived by mail rather than through
 * the legacy WordPress media library.
 *
 * Currently just Oper Graz (flagged "DRINGEND" by the client, outstanding
 * since June 2026, logo attached to the "Oper Graz ist Mitglied bei KUIN"
 * mail). Sunny's Liederlade and Klavierhaus Fiedler are also pending, but the
 * client has not supplied logo files for them — add an entry to PARTNERS below
 * once a file exists, then re-run.
 *
 * Idempotent: skips a partner whose entry already exists.
 * Run: node --import tsx scripts/migrate/add-partner-logos.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const POD_PATH = './content.pod';

const PARTNERS = [
  {
    slug: 'oper-graz',
    name: 'Oper Graz',
    website_url: 'https://www.oper-graz.com/',
    is_board_member: false,
    logoFile: 'import-source/mail/OperGraz_Logo_SCHWARZ_RGB.png',
    logoMime: 'image/png',
    logoAlt: 'Logo der Oper Graz',
  },
];

const db = openPod(POD_PATH);

for (const p of PARTNERS) {
  if (db.getEntry('partners', p.slug)) {
    console.log(`skip ${p.slug} — entry already exists`);
    continue;
  }
  const data = readFileSync(p.logoFile);
  const mediaId = randomUUID();
  db.insertMedia(mediaId, path.basename(p.logoFile), p.logoMime, data.length, data, p.logoAlt);
  db.createEntry(
    'partners',
    p.slug,
    { name: p.name, logo: mediaId, website_url: p.website_url, is_board_member: p.is_board_member },
    'published',
  );
  console.log(`added partners/${p.slug} — media ${mediaId} (${data.length} bytes, alt "${p.logoAlt}")`);
}

db.close();
