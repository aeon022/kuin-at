/**
 * One-off: rewrite embedded legacy WordPress media URLs
 * (https://kuin.at/wp-content/uploads/...) in already-migrated page and blog
 * content to the Orbiter media route (/orbiter/media/:id). The files were all
 * uploaded to the pod during Task 9's migration, but the URLs embedded inside
 * the rich-text bodies still pointed at the old WP server — which breaks the
 * moment the legacy site is decommissioned.
 *
 * Idempotent: already-rewritten URLs no longer match the pattern.
 * Run: node --import tsx scripts/migrate/fix-legacy-media-urls.ts
 */
import { openPod } from '@a83/orbiter-core';
import path from 'node:path';

const POD_PATH = './content.pod';
const LEGACY_URL = /https:\/\/kuin\.at\/wp-content\/uploads\/[^\s"'<>]+/g;

function rewriteUrls(html: string, mediaIdByFilename: Map<string, string>) {
  let changed = 0;
  const unresolved: string[] = [];
  const rewritten = html.replace(LEGACY_URL, (match) => {
    const filename = path.basename(match.split('?')[0]);
    // Only originals were uploaded to the pod (Task 9 filtered out WP's
    // -1024x725 style resize variants), so fall back to the original name.
    const original = filename.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
    const mediaId = mediaIdByFilename.get(filename) ?? mediaIdByFilename.get(original);
    if (!mediaId) {
      unresolved.push(filename);
      return match;
    }
    changed++;
    return `/orbiter/media/${mediaId}`;
  });
  return { html: rewritten, changed, unresolved };
}

const db = openPod(POD_PATH);
const mediaIdByFilename = new Map<string, string>(
  db.listMedia().map((m: { filename: string; id: string }) => [m.filename, m.id]),
);

let fixedEntries = 0;
let fixedUrls = 0;
const unresolvedAll: string[] = [];

for (const collectionId of ['pages', 'blog']) {
  for (const entry of db.getEntries(collectionId)) {
    const data = entry.data as Record<string, unknown>;
    let entryChanged = 0;
    for (const field of ['content_standard', 'content_leicht_lesen']) {
      const value = data[field];
      if (typeof value !== 'string') continue;
      const { html, changed, unresolved } = rewriteUrls(value, mediaIdByFilename);
      unresolvedAll.push(...unresolved);
      if (changed > 0) {
        data[field] = html;
        entryChanged += changed;
      }
    }
    if (entryChanged > 0) {
      db.updateEntry(collectionId, entry.slug, { data });
      fixedEntries++;
      fixedUrls += entryChanged;
      console.log(`fixed ${collectionId}/${entry.slug} (${entry.status}) — ${entryChanged} URL(s)`);
    }
  }
}

console.log(`\nDone. ${fixedEntries} entries updated, ${fixedUrls} URLs rewritten.`);
if (unresolvedAll.length > 0) {
  const counts = new Map<string, number>();
  for (const f of unresolvedAll) counts.set(f, (counts.get(f) ?? 0) + 1);
  console.log(`Unresolved (filename not in the media library), left untouched:`);
  for (const [f, n] of counts) console.log(` - ${f} (${n}x)`);
}
db.close();
