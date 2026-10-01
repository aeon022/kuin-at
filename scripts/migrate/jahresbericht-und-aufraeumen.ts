/**
 * One-off (2026-10-01):
 *  - "Jahresbericht 2025" was a blog post (listed under Archiv > Newsletter). Now a proper
 *    `downloads` entry (category jahresbericht, same PDF) and the blog post is unpublished.
 *  - unpublish legacy WordPress pages the client no longer needs: social-proof (Lorem-ipsum
 *    template), landing (replaced by the Astro start page). Unpublished = draft, not deleted.
 * Run: ORBITER_POD=... node scripts/migrate/jahresbericht-und-aufraeumen.ts
 */
import { openPod } from '@a83/orbiter-core';

const db = openPod(process.env.ORBITER_POD || './content.pod');
const JB_FILE = '5ce22d4f-53bc-4c59-8558-a765630fa788'; // KUIN-Jahresbericht-2025.pdf

if (!db.getEntry('downloads', 'jahresbericht-2025')) {
  db.createEntry('downloads', 'jahresbericht-2025', {
    title: 'Jahresbericht 2025', file: JB_FILE,
    description: 'Jahresbericht 2025 des Vereins Kultur Inklusiv.', category: 'jahresbericht',
  }, 'published');
  console.log('added downloads/jahresbericht-2025');
}

for (const [col, slug] of [['blog', 'newsletter-april-bis-juni-2025-2-2'], ['pages', 'social-proof'], ['pages', 'landing']] as const) {
  const e = db.getEntry(col, slug);
  if (!e) { console.log(`skip ${col}/${slug} — not found`); continue; }
  db.updateEntry(col, slug, { status: 'draft' });
  console.log(`unpublished ${col}/${slug} (was ${e.status})`);
}
db.close();
