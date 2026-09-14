// scripts/migrate/lib/migrateMedia.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isResizedVariant, resolveAltText, collectOriginalMediaFiles, ALT_TEXT_PLACEHOLDER } from './migrateMedia.ts';

test('isResizedVariant detects WordPress size suffixes', () => {
  assert.equal(isResizedVariant('Graz-Logo-1024x1024.png'), true);
  assert.equal(isResizedVariant('Graz-Logo-350x100.png'), true);
  assert.equal(isResizedVariant('Graz-Logo.png'), false);
  assert.equal(isResizedVariant('photo-by-yomex-owo.jpg'), false);
});

test('resolveAltText returns WP alt text when present', () => {
  const meta = new Map([['14', [{ key: '_wp_attachment_image_alt', value: 'Das KUIN Logo' }]]]);
  assert.equal(resolveAltText('14', 'KUIN-Logo.svg', meta), 'Das KUIN Logo');
});

test('resolveAltText falls back to a visible placeholder when WP has no alt text', () => {
  const meta = new Map<string, Array<{ key: string; value: string }>>();
  assert.equal(resolveAltText('99', 'photo-by-steve-johnson.jpg', meta), ALT_TEXT_PLACEHOLDER);
});

test('collectOriginalMediaFiles skips resized variants and non-media files, keeps originals', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kuin-media-test-'));
  try {
    writeFileSync(path.join(dir, 'Graz-Logo.png'), '');
    writeFileSync(path.join(dir, 'Graz-Logo-300x300.png'), '');
    writeFileSync(path.join(dir, 'Graz-Logo-1024x1024.png'), '');
    writeFileSync(path.join(dir, 'index.php'), '');
    writeFileSync(path.join(dir, 'Manifest.pdf'), '');
    const files = collectOriginalMediaFiles(dir).map((f) => path.basename(f)).sort();
    assert.deepEqual(files, ['Graz-Logo.png', 'Manifest.pdf']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
