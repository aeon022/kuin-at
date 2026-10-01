/**
 * One-off: add partners whose logo file arrived by mail rather than through
 * the legacy WordPress media library.
 *
 * Oper Graz (flagged "DRINGEND" by the client, logo attached to the "Oper Graz
 * ist Mitglied bei KUIN" mail) and Klavierhaus Fiedler & Sohn (logo from
 * "# assets/logos") and Sunny’s Liederlade (logo from "# assets/logos").
 *
 * Idempotent: skips a partner whose entry already exists.
 * Run: node --import tsx scripts/migrate/add-partner-logos.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

const POD_PATH = process.env.ORBITER_POD || './content.pod';

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
  {
    slug: 'klavierhaus-fiedler',
    name: 'Klavierhaus Fiedler & Sohn',
    website_url: 'https://www.klavierhaus-fiedler.at',
    is_board_member: false,
    // transparent PNG derived from "# assets/logos/Klavierhaus Fiedler_LOGO samt Adresse_SW.jpg", address line cropped off (unreadable at wall size)
    logoFile: 'import-source/mail/KlavierhausFiedler_Logo_ohne-Adresse.png',
    logoMime: 'image/png',
    logoAlt: 'Logo von Klavierhaus Fiedler & Sohn, Graz',
  },
  {
    slug: 'sunnys-liederlade',
    name: 'Sunny’s Liederlade',
    // no website supplied — left out rather than guessed
    is_board_member: false,
    // "# assets/logos/sunny-Logolilahintergrund.png" (full wordmark with sun, lilac tile), resized to 1600px
    logoFile: 'import-source/mail/SunnysLiederlade_Logo.png',
    logoMime: 'image/png',
    logoAlt: 'Logo von Sunny’s Liederlade',
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
