import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayContent, parseEntries } from './content.ts';
import { PartnerSchema } from '../schemas/index.ts';

test('parseEntries keeps valid entries and skips invalid ones', () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    const result = parseEntries('partners', [
      { slug: 'ok', data: { name: 'Oper Graz', logo: 'media-id' } },
      { slug: 'broken', data: { name: 'Kaputt' } },
    ], PartnerSchema);
    assert.deepEqual(result.map((e) => e.slug), ['ok']);
    assert.equal(result[0].data.name, 'Oper Graz');
  } finally {
    console.warn = warn;
  }
});

test('returns standard content when Leicht Lesen is off', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: 'Einfacher Text' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', false), 'Standard-Text');
});

test('returns leicht-lesen content when toggle is on and the field is present', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: 'Einfacher Text' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Einfacher Text');
});

test('falls back to standard content when toggle is on but leicht-lesen field is missing', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: undefined };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Standard-Text');
});

test('falls back to standard content when leicht-lesen field is an empty string', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: '' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Standard-Text');
});
