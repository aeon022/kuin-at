// scripts/setup-collections.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openPod } from '@a83/orbiter-core';
import { createKuinCollections } from './setup-collections.ts';

test('creates exactly the 6 kuin collections with expected top-level fields', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kuin-test-'));
  const podPath = path.join(dir, 'test.pod');
  try {
    createKuinCollections(podPath);
    const db = openPod(podPath);
    const ids = db.getCollections().map((c: { id: string }) => c.id).sort();
    assert.deepEqual(ids, ['archive', 'blog', 'downloads', 'events', 'pages', 'partners']);

    // @a83/orbiter-core's getCollection()/getCollections() return `schema`
    // as a raw JSON string (verified against the installed package's
    // source — createCollection stores it via JSON.stringify, the read
    // path does no JSON.parse; @a83/orbiter-admin's own routes always
    // JSON.parse(col.schema) at the call site, confirming this is the
    // real contract, not a bug). Parse it here the same way.
    const pages = db.getCollection('pages');
    const pagesSchema = JSON.parse(pages.schema);
    assert.ok('content_standard' in pagesSchema);
    assert.ok('content_leicht_lesen' in pagesSchema);

    const events = db.getCollection('events');
    const eventsSchema = JSON.parse(events.schema);
    assert.equal(eventsSchema.accessibility_features.type, 'array');

    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
