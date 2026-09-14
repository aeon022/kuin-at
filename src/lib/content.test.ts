import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayContent } from './content.ts';

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
