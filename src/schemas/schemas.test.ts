import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PageSchema, EventSchema, BlogPostSchema, ArchiveSchema, PartnerSchema, DownloadSchema } from './index.ts';

test('PageSchema accepts a minimal valid page', () => {
  const result = PageSchema.safeParse({
    title: 'Über uns', content_standard: '<p>Hallo</p>', seo_description: 'Über KUIN.',
  });
  assert.ok(result.success);
});

test('BlogPostSchema rejects an empty cover_image', () => {
  const result = BlogPostSchema.safeParse({
    title: 'News', published_at: '2026-01-01T00:00:00Z',
    cover_image: '', content_standard: '<p>x</p>',
  });
  assert.equal(result.success, false);
});

test('BlogPostSchema accepts cover_image as an Orbiter media-id string', () => {
  const result = BlogPostSchema.safeParse({
    title: 'News', published_at: '2026-01-01T00:00:00Z',
    cover_image: 'a1b2c3d4-media-id', content_standard: '<p>x</p>',
  });
  assert.ok(result.success);
});

test('EventSchema accepts accessibility_features array and optional LL field', () => {
  const result = EventSchema.safeParse({
    title: 'Stadtspaziergang', start_date: '2026-05-01T10:00:00Z', end_date: '2026-05-01T12:00:00Z',
    location: 'Hauptplatz Graz', description_standard: '<p>x</p>',
    accessibility_features: ['Gebärdensprache', 'Rollstuhlgerecht'],
  });
  assert.ok(result.success);
});

test('ArchiveSchema requires alt_text on every image', () => {
  const result = ArchiveSchema.safeParse({
    title: 'Walk 2025', year: 2025, description: 'Rückblick',
    images: [{ image_url: '/a.jpg', caption: 'Gruppenfoto' }],
  });
  assert.equal(result.success, false);
});

test('PartnerSchema accepts logo as an Orbiter media-id string, defaults is_board_member to false', () => {
  const result = PartnerSchema.safeParse({
    name: 'Universalmuseum Joanneum', logo: 'e5f6-media-id',
    website_url: 'https://www.museum-joanneum.at', description: 'Partner',
  });
  assert.ok(result.success);
  assert.equal(result.data.is_board_member, false);
});

test('DownloadSchema validates a file entry as an Orbiter media-id string', () => {
  const result = DownloadSchema.safeParse({
    title: 'KUIN Manifest', file: 'f7a8-media-id', description: 'Unser Manifest',
  });
  assert.ok(result.success);
});
