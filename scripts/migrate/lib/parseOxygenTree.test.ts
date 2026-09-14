import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractOxygenContent } from './parseOxygenTree.ts';

function tree(children: unknown[]): string {
  return JSON.stringify({ id: 0, name: 'root', depth: 0, children });
}

test('extracts a headline using its tag option, decoding HTML entities', () => {
  const json = tree([
    { id: 1, name: 'ct_headline', options: { ct_content: 'Anfragen &amp; Information', original: { tag: 'h1' } } },
  ]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Anfragen & Information</h1>');
  assert.deepEqual(notes, []);
});

test('defaults headline tag to h2 when original.tag is missing or invalid', () => {
  const json = tree([{ id: 1, name: 'ct_headline', options: { ct_content: 'Titel', original: [] } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h2>Titel</h2>');
});

test('wraps text_block content in its tag option, default p', () => {
  const json = tree([{ id: 1, name: 'ct_text_block', options: { ct_content: 'Hallo Welt', original: { tag: 'p' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<p>Hallo Welt</p>');
});

test('resolves image alt text via the provided resolver, keyed by src filename', () => {
  const json = tree([{ id: 1, name: 'ct_image', options: { original: { src: 'https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg' } } }]);
  const { html } = extractOxygenContent(json, (src) => (src.includes('KUIN-Logo') ? 'Das KUIN Logo' : null));
  assert.equal(html, '<img src="https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg" alt="Das KUIN Logo" />');
});

test('falls back to a visible placeholder alt when the resolver returns null', () => {
  const json = tree([{ id: 1, name: 'ct_image', options: { original: { src: 'https://kuin.at/x.jpg' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.match(html, /alt="\[ALT-TEXT TODO/);
});

test('renders a link_button as an anchor with its url and label', () => {
  const json = tree([{ id: 1, name: 'ct_link_button', options: { ct_content: 'Über uns', original: { url: 'https://kuin.at/der-verein/', target: '' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<a href="https://kuin.at/der-verein/">Über uns</a>');
});

test('container nodes (div/section) emit no wrapper tag of their own, just their children', () => {
  const json = tree([
    { id: 1, name: 'ct_div_block', options: {}, children: [
      { id: 2, name: 'ct_section', options: {}, children: [
        { id: 3, name: 'ct_headline', options: { ct_content: 'Netzwerk', original: { tag: 'h1' } } },
      ] },
    ] },
  ]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Netzwerk</h1>');
});

test('skips header/nav/decorative nodes silently (no note, no output) since they are not page content', () => {
  const json = tree([
    { id: 1, name: 'oxy_header', options: {}, children: [{ id: 2, name: 'ct_fancy_icon', options: {} }] },
    { id: 3, name: 'ct_headline', options: { ct_content: 'Echter Inhalt', original: { tag: 'h1' } } },
  ]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Echter Inhalt</h1>');
  assert.deepEqual(notes, []);
});

test('preserves an unrenderable shortcode as an HTML comment and flags it in notes', () => {
  const json = tree([{ id: 1, name: 'ct_shortcode', options: { original: { full_shortcode: '[fluentform id=3]' } } }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.match(html, /SHORTCODE TODO.*\[fluentform id=3\]/);
  assert.equal(notes.length, 1);
});

test('drops a dynamic posts-grid widget with an informational note', () => {
  const json = tree([{ id: 1, name: 'oxy_posts_grid', options: {} }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '');
  assert.match(notes[0], /dynamic post grid/);
});

test('forwards text from an unknown component type as a paragraph, flagged for review', () => {
  const json = tree([{ id: 1, name: 'ct_some_future_widget', options: { ct_content: 'Neuer Inhalt' } }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<p>Neuer Inhalt</p>');
  assert.match(notes[0], /unknown component type/);
});

test('returns empty html and a note on invalid JSON instead of throwing', () => {
  const { html, notes } = extractOxygenContent('{not valid json', () => null);
  assert.equal(html, '');
  assert.equal(notes.length, 1);
});
