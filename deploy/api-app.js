// app.js — Plesk/Passenger's default expected startup filename at the
// Application Root. Runs @a83/orbiter-admin's real CLI entry (its own
// package.json declares "type": "module", so Node treats its files as ESM
// independently of this file's own type — dynamic import() bridges the
// two either way). ORBITER_POD and ADMIN_ORIGIN are set here rather than
// via Plesk's "Custom environment variables" field so this whole deploy
// stays self-contained in the files Claude can upload over SSH.
process.env.ORBITER_POD = process.env.ORBITER_POD || require('path').join(__dirname, 'content.pod');
// server.js's csrfMiddleware rejects any mutating request (POST/PUT/PATCH/
// DELETE) whose Origin header isn't in this list — without it, it defaults
// to localhost-only, so both the admin UI's own same-origin requests (e.g.
// changing your password) AND the public Kontakt-/Newsletter-Formulare
// posting here cross-origin from the main site fail with "CSRF check
// failed". List every real origin that will ever submit here: the admin
// itself, the preview deploy, and the eventual production domain.
process.env.ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || 'https://api.kuin.at,https://preview.kuin.at,https://kuin.at';
import('@a83/orbiter-admin/src/cli.js');
