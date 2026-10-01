/**
 * One-off (2026-10-01): make sure every image that can render has real alt text.
 *  - archive gallery: generic "Foto vom KUIN-Spaziergang am …" alts get " (Bild N von M)"
 *    so each photo is unique and orientation works; hand-written descriptions are kept.
 *  - inline <img> in pages/blog bodies: alt set per media id (logos, stock, flyer).
 *  - landing page pointed at the deleted AXE/Popella media → repointed to the new ones.
 *  - _media.alt synced for everything used (logos, covers, archive photos).
 * Run: ORBITER_POD=... [DRY=1] node scripts/migrate/fix-alt-texts.ts
 */
import { openPod } from '@a83/orbiter-core';

const DRY = !!process.env.DRY;
const db = openPod(process.env.ORBITER_POD || './content.pod');
const log = (...a: unknown[]) => console.log(...a);

const OLD_TO_NEW: Record<string, string> = {
  'd2df8c39-1098-4754-a200-55c10135f146': 'e7ddaf29-6380-4654-8a04-e2444a455ce9', // AXE
  '686d8ee9-6d4d-4fc6-8360-086f517dcb93': '185e750a-997b-4e57-b7cb-2c44b8dd5859', // Popella
};

const INLINE_ALT: Record<string, string> = {
  'fef077d0-746a-4da1-ab0a-ec9da7dd8ceb': 'Violettes Schild im Gras mit weißem Rollstuhl-Symbol, dem Text „Step free Route“ und einem Pfeil nach rechts',
  '228303a0-d7e9-44cc-93bb-1b02bbde2a02': 'Logo der Akademie Graz',
  'eea10ed9-58f7-44ac-a54f-485fa249ec4d': 'Logo von Die Brücke – soziokulturelles Zentrum',
  'ef1cfb1d-1e0e-41fa-bbda-ec2f99825213': 'Logo des Graz Museums',
  'ac76db18-ca8c-41ea-9e46-e208a43410f9': 'Logo von LebensGroß',
  '166de529-15e2-457d-a09e-3895d535bd01': 'Logo von FRida & freD – Das Grazer Kindermuseum',
  '6ffdd68e-9fa5-4834-959a-4008e6952490': 'Logo des Kunsthauses Graz',
  '227ea16b-175e-4488-af9c-c588c8145b03': 'Logo der Kunstuniversität Graz',
  '4dfaf9e7-e47b-4335-b14e-f588c272c75f': 'Logo des Universalmuseums Joanneum',
  'e7ddaf29-6380-4654-8a04-e2444a455ce9': 'Logo von aXe – Kunst für ALLE!',
  'c702ccc0-05fd-4550-b928-620d5e8fa003': 'Logo des InTaKT Festivals',
  '86f3a770-c8b7-442f-b19d-0ab3d010e154': 'Logo des Mezzanin Theaters',
  '185e750a-997b-4e57-b7cb-2c44b8dd5859': 'Logo von Popella',
  '826af342-7e7f-473f-ad39-5df0fbb96f80': 'Logo des Salon Stolz',
  '583e48a8-65b2-4e94-9f6e-adcd753c458d': 'Logo des Schauspielhauses Graz',
  '26268e2d-f80d-4940-85d8-49b70db81089': 'Logo von Selbstbestimmt Leben Steiermark',
  'b6e9267d-1af8-4e5d-9315-c32cb8df1c07': 'Illustrierter Briefumschlag mit dem Schriftzug „Newsletter“',
  '6923fde6-9248-406d-8213-2decc73b8ad8': 'Logo der Stadt Graz mit dem Hinweis „Mit freundlicher Unterstützung der Stadt Graz“',
  '05702c2b-c0ca-47d7-aef4-72e285f169cb': 'Logo von Kultur Inklusiv',
  '1b32d15b-e038-4073-b0c7-d5bfe11695ed':
    'Programmübersicht „Kultur Inklusiv: Sei dabei!“: KUIN – Unterwegs in Graz, ein gemeinsamer inklusiver Kultur-Spaziergang für Kinder und Familien, Freitag 25.9.2026 von 15 bis 17:15 Uhr, Treffpunkt im Atelier Randkunst von LebensGroß; Ablauf: Workshop „Wir machen Fahnen“, musikalische Wegbegleitung, Mitmach-Theaterstück „Forscherixa und die wilde Hummel“; mit Gebärdensprachdolmetschung, Anmeldung an office@kuin.at bis 20.9.2026. Vorschau: Sa., 24.10.2026 Workshoptag für Kinder und Jugendliche; Mi., 11.11.2026 Konferenz zur kulturellen Teilhabe von Kindern und Jugendlichen mit Behinderungen in der KUG Brandhofgasse; Mi., 9.12.2026 Unterwegs in der Oper Graz',
};

const mediaId = (url: string) => url.match(/\/orbiter\/media\/([0-9a-f-]{36})/)?.[1];
const setMediaAlt = (id: string, alt: string) => {
  if (!DRY) db.db.prepare('UPDATE _media SET alt = ? WHERE id = ? AND (alt IS NULL OR alt = \'\')').run(alt, id);
};

// inline <img>: repoint deleted media, then set alt per id (generic fallback for unknown ids)
function fixHtml(html: string, fallback: (id: string | undefined, n: number) => string | undefined) {
  let n = 0, changed = 0;
  for (const [o, nw] of Object.entries(OLD_TO_NEW)) html = html.split(o).join(nw);
  const out = html.replace(/<img\b[^>]*>/g, (tag) => {
    n++;
    const id = mediaId(tag.match(/\bsrc="([^"]*)"/)?.[1] ?? '');
    const alt = (id && INLINE_ALT[id]) || fallback(id, n);
    if (!alt) return tag;
    const has = tag.match(/\balt="([^"]*)"/);
    if (has && has[1].trim() && !(id && INLINE_ALT[id])) return tag; // keep existing real alt unless we have a better one
    changed++;
    if (id) setMediaAlt(id, alt);
    return has ? tag.replace(/\balt="[^"]*"/, `alt="${alt}"`) : tag.replace(/<img\b/, `<img alt="${alt}"`);
  });
  return { out, changed };
}

// 1) archive gallery
const archiveAlt = new Map<string, string>();
for (const e of db.getEntries('archive')) {
  const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
  const imgs = data.images as { image_url: string; alt_text: string }[];
  const generic = /^Foto vom KUIN-Spaziergang am .*\d{4}$/;
  imgs.forEach((im, i) => {
    if (generic.test(im.alt_text.trim())) im.alt_text = `${im.alt_text.trim()} (Bild ${i + 1} von ${imgs.length})`;
    const id = mediaId(im.image_url);
    if (id) { archiveAlt.set(id, im.alt_text); setMediaAlt(id, im.alt_text); }
  });
  log(`archive/${e.slug}: ${imgs.length} images, e.g. "${imgs[1]?.alt_text}"`);
  if (!DRY) db.updateEntry('archive', e.slug, { data });
}

// 2) page + blog bodies
for (const col of ['pages', 'blog']) {
  for (const e of db.getEntries(col)) {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    const f = 'content_standard';
    if (typeof data[f] !== 'string' || !data[f].includes('<img')) continue;
    if (e.slug === 'social-proof') { log('skip social-proof (template placeholder page)'); continue; }
    const { out, changed } = fixHtml(data[f], (id, n) => (id && archiveAlt.get(id)) || (col === 'blog' ? `Foto vom KUIN-Spaziergang (Bild ${n})` : undefined));
    log(`${col}/${e.slug}: ${changed} alt(s) set`);
    if (changed && !DRY) db.updateEntry(col, e.slug, { data: { ...data, [f]: out } });
  }
}

// 3) media library alt for logos and covers
for (const e of db.getEntries('partners')) {
  const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
  if (d.logo) setMediaAlt(d.logo, `Logo von ${d.name}`);
}
for (const e of db.getEntries('blog')) {
  const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
  if (d.cover_image) setMediaAlt(d.cover_image, `Titelbild: ${d.title}`);
}
log(DRY ? 'DRY RUN — nothing written' : 'done');
db.close();
