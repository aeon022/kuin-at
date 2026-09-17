// app.js — Plesk/Passenger's default expected startup filename at the
// Application Root. The real Astro server (built by `npm run build`,
// @astrojs/node in standalone mode — it reads HOST/PORT from the
// environment, exactly what Passenger provides) lives in dist/server/
// entry.mjs, an ES module; loading it via dynamic import() works whether
// this file itself is parsed as CommonJS or ESM, so no extra package.json
// "type" field is needed here.
import('./dist/server/entry.mjs');
