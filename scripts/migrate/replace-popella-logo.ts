/**
 * One-off (2026-10-04): neues Popella-Logo. Das alte (popella.svg, 187x69, falsches Seitenverhältnis, unscharf)
 * bleibt als Media-Eintrag erhalten, der Partner zeigt nur auf das neue PNG (1400px breit, aus
 * "# assets/logos/Popella_2023_Logo_white_transparent.png"). Idempotent.
 * Run: ORBITER_POD=... node --import tsx scripts/migrate/replace-popella-logo.ts
 */
import { openPod } from '@a83/orbiter-core';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const FILE = 'scripts/migrate/assets/popella-logo.png';
const db = openPod(process.env.ORBITER_POD || './content.pod');
const e = db.getEntry('partners', 'popella');
if (!e) { console.log('skip — partners/popella not found'); process.exit(0); }
const cur = db.getMediaItem(e.data.logo);
if (cur?.filename === 'popella-logo.png') { console.log('skip — already replaced'); process.exit(0); }

const data = readFileSync(FILE);
const id = randomUUID();
db.insertMedia(id, 'popella-logo.png', 'image/png', data.length, data, 'Logo von Popella');
db.updateEntry('partners', 'popella', { data: { ...e.data, logo: id } });
console.log(`popella logo: ${e.data.logo} -> ${id} (${data.length} bytes)`);
db.close();
