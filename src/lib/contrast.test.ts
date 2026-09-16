import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relativeLuminance, contrastRatio } from './contrast.ts';

test('relativeLuminance of pure white is 1, pure black is 0', () => {
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 0.0001);
  assert.ok(Math.abs(relativeLuminance('#000000') - 0) < 0.0001);
});

test('contrastRatio of black on white is 21:1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
});

test('brand body-text pairs meet WCAG AAA (>=7:1) for normal text', () => {
  // ink on bg — primary reading pair used site-wide
  assert.ok(contrastRatio('#2b2420', '#fdfcfb') >= 7, 'ink on bg must be >= 7:1');
  // rose-700 (text-safe shade) on bg
  assert.ok(contrastRatio('#7a2f42', '#fdfcfb') >= 7, 'rose-700 on bg must be >= 7:1');
  // slate-700 (text-safe shade) on bg
  assert.ok(contrastRatio('#32415a', '#fdfcfb') >= 7, 'slate-700 on bg must be >= 7:1');
});

test('contrastRatio is symmetric', () => {
  assert.equal(contrastRatio('#111111', '#eeeeee'), contrastRatio('#eeeeee', '#111111'));
});
