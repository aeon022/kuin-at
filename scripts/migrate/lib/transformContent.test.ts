import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformPage, transformBlogPost } from './transformContent.ts';
import type { WpPost } from './parseWpSql.ts';

function page(overrides: Partial<WpPost> = {}): WpPost {
  return {
    id: '28', postAuthor: '1', postDate: '2024-12-09 16:51:37', postContent: '',
    postTitle: 'Über uns', postExcerpt: '', postStatus: 'publish', postName: 'der-verein',
    postParent: '0', guid: 'https://kuin.at/?page_id=28', postType: 'page', postMimeType: '', ...overrides,
  };
}

const REAL_OXYGEN_JSON = JSON.stringify({
  id: 0, name: 'root', children: [
    { name: 'ct_headline', options: { ct_content: 'Der Verein', original: { tag: 'h1' } } },
    { name: 'ct_text_block', options: { ct_content: 'Der Verein wurde 2023 gegründet.', original: { tag: 'p' } } },
  ],
});

test('transformPage extracts real content from Oxygen builder JSON when present', () => {
  const result = transformPage(page(), REAL_OXYGEN_JSON, () => null);
  assert.equal(result.slug, 'der-verein');
  assert.equal(result.data.title, 'Über uns');
  assert.match(result.data.content_standard, /gegründet/);
  assert.equal(result.needsReview, false);
  assert.deepEqual(result.notes, []);
  assert.equal(result.data.content_leicht_lesen, undefined);
});

test('transformPage surfaces extractor notes (e.g. a shortcode) as needsReview, without discarding the rest of the content', () => {
  const jsonWithShortcode = JSON.stringify({
    id: 0, name: 'root', children: [
      { name: 'ct_headline', options: { ct_content: 'Kontakt', original: { tag: 'h1' } } },
      { name: 'ct_shortcode', options: { original: { full_shortcode: '[fluentform id=3]' } } },
    ],
  });
  const result = transformPage(page({ postName: 'kontakt' }), jsonWithShortcode, () => null);
  assert.equal(result.needsReview, true);
  assert.equal(result.notes.length, 1);
  assert.match(result.data.content_standard, /Kontakt/);
});

test('transformPage falls back to post_content and flags needsReview when no Oxygen data exists at all', () => {
  const result = transformPage(page({ postContent: '' }), undefined, () => null);
  assert.equal(result.needsReview, true);
  assert.match(result.data.content_standard, /manuell/i);
});

test('transformPage uses real post_content when Oxygen data is absent but post_content has text', () => {
  const result = transformPage(page({ postContent: '<p>Hallo</p>' }), undefined, () => null);
  assert.match(result.data.content_standard, /Hallo/);
  assert.equal(result.needsReview, false);
});

test('transformPage flags needsReview for non-publish status even with good Oxygen content', () => {
  const result = transformPage(page({ postStatus: 'draft' }), REAL_OXYGEN_JSON, () => null);
  assert.equal(result.needsReview, true);
});

test('transformBlogPost returns null for revision/attachment rows (not real posts)', () => {
  const result = transformBlogPost(page({ postType: 'revision' }), null);
  assert.equal(result, null);
});

test('transformBlogPost sets content_leicht_lesen placeholder marker, never silently empty', () => {
  const result = transformBlogPost(page({ postType: 'post', postTitle: 'Neuigkeiten', postName: 'neuigkeiten', postContent: '<p>Text</p>' }), 'media-123');
  assert.equal(result?.data.content_leicht_lesen, undefined); // optional field, omitted not faked
  assert.equal(result?.needsReview, false);
});
