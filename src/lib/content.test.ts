import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntries } from './content.ts';
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
