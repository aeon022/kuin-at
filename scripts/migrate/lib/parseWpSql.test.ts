// scripts/migrate/lib/parseWpSql.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInsertTuples, parsePosts, parsePostmeta } from './parseWpSql.ts';

const FIXTURE_POSTS = `
INSERT INTO \`wp_posts\` VALUES
(1,1,'2024-05-14 08:28:36','2024-05-14 08:28:36','<p>Hello, it\\'s us</p>','Kontakt','','publish','closed','closed','','kontakt','','','2024-05-14 08:28:36','2024-05-14 08:28:36','',0,'https://kuin.at/?p=1',0,'page','',0),
(2,1,'2024-05-14 09:00:00','2024-05-14 09:00:00','','Logo','','inherit','open','closed','','logo','','','2024-05-14 09:00:00','2024-05-14 09:00:00','',0,'https://kuin.at/wp-content/uploads/2024/05/Logo.svg',0,'attachment','image/svg+xml',0);
`;

const FIXTURE_POSTMETA = `
INSERT INTO \`wp_postmeta\` VALUES
(1,2,'_wp_attachment_image_alt','Das KUIN Logo'),
(2,2,'_wp_attachment_metadata','a:1:{s:5:\\"width\\";i:100;}');
`;

test('parseInsertTuples splits top-level tuples, respecting escaped quotes', () => {
  const rows = parseInsertTuples(FIXTURE_POSTS, 'posts');
  assert.equal(rows.length, 2);
  assert.equal(rows[0][4], "<p>Hello, it's us</p>"); // post_content, unescaped
  assert.equal(rows[0][5], 'Kontakt'); // post_title
});

test('parsePosts maps tuples to typed WpPost rows', () => {
  const posts = parsePosts(FIXTURE_POSTS);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].postType, 'page');
  assert.equal(posts[0].postName, 'kontakt');
  assert.equal(posts[1].postType, 'attachment');
  assert.equal(posts[1].postMimeType, 'image/svg+xml');
});

test('parsePostmeta groups meta rows by post id', () => {
  const meta = parsePostmeta(FIXTURE_POSTMETA);
  const metaForPost2 = meta.get('2') ?? [];
  const alt = metaForPost2.find((m) => m.key === '_wp_attachment_image_alt');
  assert.equal(alt?.value, 'Das KUIN Logo');
});
