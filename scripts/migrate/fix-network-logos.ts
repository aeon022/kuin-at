// One-off fix script (run once, not part of the ongoing migration):
//
// The Oxygen extractor originally only read `ct_image.original.src`
// (image_type "1" — direct URL). The Landing page's real "Netzwerk" section
// uses image_type "2" instead, which stores the image at `attachment_url` —
// so all 16 network-partner logos silently came out as empty <a> tags.
// parseOxygenTree.ts has since been fixed to check both fields.
//
// This script (a) re-extracts the affected pages' content_standard against
// the fixed extractor so the logos appear inline again, and (b) creates real
// `partners` collection entries for the 15 actual network organizations
// (excluding the Stadt Graz "mit freundlicher Unterstützung" sponsor credit,
// which is a funding acknowledgement, not a network member) using the
// already-uploaded media.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { openPod } from '@a83/orbiter-core';
import { parsePosts, parsePostmeta } from './lib/parseWpSql.ts';
import { extractOxygenContent } from './lib/parseOxygenTree.ts';

const ROOT = process.cwd();
const SQL_PATH = path.join(ROOT, 'import-source/wp_9bhnv_2026-09-14_13-30-44.sql');
const POD_PATH = path.join(ROOT, 'content.pod');

const sql = readFileSync(SQL_PATH, 'utf-8');
const posts = parsePosts(sql);
const postmeta = parsePostmeta(sql);

const db = openPod(POD_PATH);
const media = db.listMedia();
const mediaIdByFilename = new Map(media.map((m: { filename: string; id: string }) => [m.filename, m.id]));
const altByFilename = new Map(media.map((m: { filename: string; alt: string | null }) => [m.filename, m.alt]));

function resolveImageAltBySrc(src: string): string | null {
  const filename = path.basename(src.split('?')[0]);
  return altByFilename.get(filename) ?? null;
}

// ── Step 1: re-extract affected pages ──────────────────────────────────
const affectedSlugs = ['landing', 'kuin'];
for (const post of posts.filter((p) => p.postType === 'page' && affectedSlugs.includes(p.postName))) {
  const oxygenJson = (postmeta.get(post.id) ?? []).find((m) => m.key === '_ct_builder_json')?.value;
  if (!oxygenJson) continue;
  const { html, notes } = extractOxygenContent(oxygenJson, resolveImageAltBySrc);
  const entry = db.getEntry('pages', post.postName);
  if (!entry) continue;
  const data = { ...entry.data, content_standard: html };
  db.updateEntry('pages', post.postName, { data });
  console.log(`re-extracted pages/${post.postName} — ${html.length} chars, ${notes.length} notes`);
}

// ── Step 2: create real Partners entries for the 15 network members ────
const NETWORK_PARTNERS: Array<{ slug: string; name: string; filename: string; website_url: string }> = [
  { slug: 'akademie-graz', name: 'Akademie Graz', filename: 'Akademie-Graz.png', website_url: 'https://akademie-graz.at/' },
  { slug: 'die-bruecke', name: 'Die Brücke', filename: 'Bruecke-Logo-Transparent.svg', website_url: 'https://diebruecke.social' },
  { slug: 'grazmuseum', name: 'GrazMuseum', filename: 'Graz-Museum.png', website_url: 'https://www.grazmuseum.at/' },
  { slug: 'lebensgross', name: 'LebensGroß', filename: 'logo-lebensgross-black.svg', website_url: 'https://www.lebensgross.at/' },
  { slug: 'frida-und-fred', name: 'FRida & freD', filename: 'Fride-und-Fred.svg', website_url: 'https://fridaundfred.at/' },
  { slug: 'kunsthaus-graz', name: 'Kunsthaus Graz', filename: 'KunsthausGraz.svg', website_url: 'https://www.museum-joanneum.at/kunsthaus-graz' },
  { slug: 'kug', name: 'Kunstuniversität Graz', filename: 'KunstUniGraz.svg', website_url: 'https://www.kug.ac.at/' },
  { slug: 'universalmuseum-joanneum', name: 'Universalmuseum Joanneum', filename: 'Universalmuseum-Joanneum.svg', website_url: 'https://www.museum-joanneum.at/' },
  { slug: 'axe-graz', name: 'AXE Graz', filename: 'axe.svg', website_url: 'https://axe-graz.at/' },
  { slug: 'intakt-festival', name: 'InTaKT-Festival', filename: 'inTakt.svg', website_url: 'https://intakt-festival.at/' },
  { slug: 'mezzanin-theater', name: 'mezzanin theater', filename: 'mezzanin-theater.svg', website_url: 'https://mezzanintheater.at/' },
  { slug: 'pupella', name: 'Pupella', filename: 'pupella.svg', website_url: 'https://popella.at/' },
  { slug: 'salon-stolz', name: 'Salon Stolz', filename: 'salon-stolz.svg', website_url: 'https://salonstolz.at/' },
  { slug: 'schauspielhaus-graz', name: 'Schauspielhaus Graz', filename: 'schauspielhaus.svg', website_url: 'https://schauspielhaus-graz.buehnen-graz.com/' },
  { slug: 'sl-stmk', name: 'Selbstbestimmt Leben Steiermark', filename: 'SL.svg', website_url: 'https://www.sl-stmk.at/' },
];

let created = 0;
let skipped = 0;
for (const p of NETWORK_PARTNERS) {
  const existing = db.getEntry('partners', p.slug);
  if (existing) { console.log(`skip partners/${p.slug} — already exists`); skipped++; continue; }
  const logoId = mediaIdByFilename.get(p.filename);
  if (!logoId) { console.log(`SKIP ${p.slug} — media not found for ${p.filename}`); continue; }
  db.createEntry('partners', p.slug, {
    name: p.name,
    logo: logoId,
    website_url: p.website_url,
    is_board_member: false,
  }, 'published');
  console.log(`created partners/${p.slug} — logo ${logoId}`);
  created++;
}

console.log(`\nDone. ${created} partners created, ${skipped} already existed.`);
db.close();
