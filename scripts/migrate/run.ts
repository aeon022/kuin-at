import path from 'node:path';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openPod } from '@a83/orbiter-core';
import { createKuinCollections } from '../setup-collections.ts';
import { parsePosts, parsePostmeta } from './lib/parseWpSql.ts';
import { transformPage, transformBlogPost } from './lib/transformContent.ts';
import { collectOriginalMediaFiles, resolveAltText } from './lib/migrateMedia.ts';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const SQL_PATH = path.join(ROOT, 'import-source/wp_9bhnv_2026-09-14_13-30-44.sql');
const UPLOADS_DIR = path.join(ROOT, 'import-source/uploads');
const POD_PATH = path.join(ROOT, 'content.pod');

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.gif': 'image/gif',
};

async function main() {
  const needsReview: string[] = [];

  console.log('→ creating collections');
  createKuinCollections(POD_PATH);
  const db = openPod(POD_PATH);

  const sql = readFileSync(SQL_PATH, 'utf-8');
  const posts = parsePosts(sql);
  const postmeta = parsePostmeta(sql);

  console.log('→ migrating media');
  const mediaIdByFilename = new Map<string, string>();
  const altByFilename = new Map<string, string>();
  // Attachment guids are unreliable for this join — many use pretty
  // permalinks or `?attachment_id=N` rather than the raw upload URL (and it's
  // exactly the attachments with real legacy alt text that do this). The
  // `_wp_attached_file` postmeta always holds the real relative upload path,
  // so match on that instead.
  const attachmentByFilename = new Map<string, (typeof posts)[number]>();
  for (const p of posts) {
    if (p.postType !== 'attachment') continue;
    const attachedFile = (postmeta.get(p.id) ?? []).find((m) => m.key === '_wp_attached_file')?.value;
    if (attachedFile) attachmentByFilename.set(path.basename(attachedFile), p);
  }
  for (const filePath of collectOriginalMediaFiles(UPLOADS_DIR)) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    const data = readFileSync(filePath);
    const attachmentPost = attachmentByFilename.get(filename);
    const alt = attachmentPost ? resolveAltText(attachmentPost.id, filename, postmeta) : '[ALT-TEXT TODO: Bild manuell beschreiben]';
    if (alt.startsWith('[ALT-TEXT')) needsReview.push(`media: ${filename} — no alt text in legacy data`);
    const id = randomUUID();
    db.insertMedia(id, filename, mime, data.length, data, alt);
    mediaIdByFilename.set(filename, id);
    altByFilename.set(filename, alt);
  }
  console.log(`  uploaded ${mediaIdByFilename.size} original media files`);

  // Oxygen's ct_image nodes reference the original upload URL directly
  // (e.g. https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg) — match
  // by filename against what was just uploaded.
  function resolveImageAltBySrc(src: string): string | null {
    const filename = path.basename(src.split('?')[0]);
    return altByFilename.get(filename) ?? null;
  }

  console.log('→ migrating pages (extracting real content from Oxygen builder JSON)');
  let pageCount = 0;
  const usedPageSlugs = new Set<string>();
  for (const post of posts.filter((p) => p.postType === 'page')) {
    if (!post.postName) continue;
    const oxygenJson = (postmeta.get(post.id) ?? []).find((m) => m.key === '_ct_builder_json')?.value;
    let { slug, data, needsReview: flagged, notes } = transformPage(post, oxygenJson, resolveImageAltBySrc);
    // WP allows the same post_name across posts with different statuses (e.g.
    // a draft and its published original); Orbiter enforces unique slugs, so
    // disambiguate and flag for manual rename.
    if (usedPageSlugs.has(slug)) {
      const original = slug;
      slug = `${slug}-${post.id}`;
      needsReview.push(`pages/${slug}: slug collided with another page's "${original}" — auto-renamed, verify/fix manually`);
    }
    usedPageSlugs.add(slug);
    db.createEntry('pages', slug, data, post.postStatus === 'publish' ? 'published' : 'draft');
    pageCount++;
    for (const note of notes) needsReview.push(`pages/${slug}: ${note}`);
    if (flagged && notes.length === 0) needsReview.push(`pages/${slug}: content needs manual review (no Oxygen data, or non-publish status)`);
  }
  console.log(`  migrated ${pageCount} pages`);

  console.log('→ migrating blog posts');
  let blogCount = 0;
  for (const post of posts.filter((p) => p.postType === 'post')) {
    const thumbMeta = (postmeta.get(post.id) ?? []).find((m) => m.key === '_thumbnail_id');
    // As with alt text above, the thumbnail attachment's guid is often a
    // pretty-permalink URL rather than the raw upload path — resolve the
    // real filename via _wp_attached_file instead.
    const attachedFile = thumbMeta ? (postmeta.get(thumbMeta.value) ?? []).find((m) => m.key === '_wp_attached_file')?.value : undefined;
    const coverImageId = attachedFile ? mediaIdByFilename.get(path.basename(attachedFile)) ?? null : null;
    const result = transformBlogPost(post, coverImageId);
    if (!result) continue;
    db.createEntry('blog', result.slug, result.data, post.postStatus === 'publish' ? 'published' : 'draft');
    blogCount++;
    if (result.needsReview) needsReview.push(`blog/${result.slug}: content or cover image needs manual review`);
  }
  console.log(`  migrated ${blogCount} blog posts`);

  console.log('→ partners/events/archive/downloads have no structured per-entry legacy data');
  needsReview.push('partners: no structured legacy data — add manually from partner logo SVGs in import-source/uploads/2025/02/');
  needsReview.push("events: the WP 'Veranstaltungen' page was an intro page only (migrated into Pages) — add individual Events manually");
  needsReview.push("archive: the WP 'Archiv' page was an intro page only (migrated into Pages) — add individual year galleries manually");
  needsReview.push('downloads: only KUIN-Manifest.pdf found as a clear download — verify others manually');

  db.close();

  console.log(`\n=== Migration report: ${needsReview.length} items need manual follow-up ===`);
  for (const item of needsReview) console.log(' -', item);
}

main();
