# kuin.at — Roadmap / To-do

Kurzfassung auf einen Blick. Stand: **2026-10-04**, Branch `build/kuin-relaunch`, Preview: <https://preview.kuin.at>.
Das ausführliche Protokoll (Warum, Fehler, Zahlen) steht in [`stage.md`](stage.md), die Serverdetails in [`agent.md`](agent.md).
Der ursprüngliche Plan `docs/superpowers/plans/2026-09-14-kuin-relaunch.md` ist abgeschlossen (alle 13 Tasks erledigt, siehe unten).

**Pflege:** Neue Punkte unten bei „Offen“ ergänzen, beim Erledigen nach oben verschieben und mit Datum abhaken.

---

## Offen

### Vor dem Go-live
- [ ] `kuin.at` von Coming-Soon (`coming-soon/`) auf die Astro-App umstellen (vhost/DNS)
- [ ] Weiterleitungen der alten WordPress-URLs
- [ ] Sitemap prüfen und in der Search Console anmelden (Preview ist bereits `noindex` + `Disallow`; auf `kuin.at` greift automatisch `index, follow` und `Allow`, kein Umbau nötig)
- [ ] Impressum, Datenschutz, Cookie-Richtlinie abschließend prüfen
- [ ] Mit der Stadt Graz abstimmen, dass der Kalender-Hinweis (Sticker auf `/events`) so passt

### Vor dem Go-live — Empfehlungen (04.10.)
- [x] Alte DB-Sicherungen auf dem Server aufgeräumt (04.10.): 19 gelöscht, behalten `bak-pre-people-2026-10-02` und `bak-pre-fix-edi-haberl-2026-10-04` (1,5 GB → 201 MB)
- [ ] **Externes Backup** einrichten (Plesk-Backup-Manager und/oder regelmäßiger Download der Live-DB auf den Mac) — aktuell liegt jede Sicherung auf demselben Server wie die Live-DB
- [ ] **301-Weiterleitungen** der alten WordPress-URLs (13 Seiten, 25 Beiträge), Sitemap in der Search Console anmelden
- [ ] **Formulare testen** (Kontakt, Newsletter → `api.kuin.at`): Spam-Schutz/Rate-Limit, Mails kommen an
- [ ] **Admin `api.kuin.at` absichern:** starkes Passwort, nur nötige Konten, Zugriff nach Möglichkeit einschränken
- [ ] **DNS:** TTL vorher senken, `www` → `kuin.at`, SSL prüfen, Umschaltzeitpunkt mit erreichbarem Team
- [ ] **Uptime-Check** (z. B. UptimeRobot) mit Mail an das Team
- [ ] Nach dem Go-live: Screenreader-Test mit echten Nutzer:innen, Leicht-Lesen-Texte von einer Prüfstelle gegenlesen lassen; optional datenschutzfreundliche Statistik (Matomo/Plausible)

### Medien-Speicher (Orbiter) — Entscheidung bei Bedarf
Stand: 224 Medien, 68,5 MB in `content.pod` (159 JPEG 45 MB, 32 PDF 23 MB) — unkritisch. Orbiter kann Medien auch anders speichern
(Admin → Settings → Media storage, kein Neustart): `blob` (jetzt, in der DB), `local` (Ordner auf dem Server), `s3` (S3-kompatibel, z. B. EU-Anbieter/Cloudflare R2),
`github` (nicht empfohlen), External link (nicht empfohlen: instabile Links, Datenschutz).
- [ ] Beim Admin-Upload WebP aktivieren (`media.img_convert_webp`), Maximalbreite/Qualität prüfen (Standard 2400 px / 85)
- [ ] Ab ca. 500 MB Fotos: auf `local` oder `s3` umstellen; dann **Medienordner/Bucket ins Backup** aufnehmen (nicht mehr in `content.pod`). Bestehende Medien bleiben im Blob, nur neue Uploads gehen an das neue Ziel
- [ ] Dropbox/Google Drive/WeTransfer **nicht** als Bildquelle verwenden

### Inhalte
- [ ] **Fotos** für Angela Fink, Susanne Maurer-Aldrian, Anita Brodtrager, Edi Haberl (aktuell Platzhalterfoto)
- [ ] **Funktion/Rolle** für Anita Brodtrager (aktuell „Teammitglied")
- [ ] Oper-Graz-Termin (9.12.2026): Uhrzeit und Details fehlen (wird ohne Zeit angezeigt)
- [ ] Leicht-Lesen-Texte für die drei neuen Events (optionales Feld im Admin)
- [ ] Sunny’s Liederlade: Website-URL fehlt
- [ ] Verify Downloads über `KUIN-Manifest.pdf` hinaus
- [ ] Oxygen-only-Seiten mit `needsReview` redaktionell prüfen
- [ ] Entwürfe entscheiden: `blog/kuin-spaziergang` (137 Fotos, Alt-Texte gesetzt), zwei Rathaus-Entwürfe

### Technik / Aufräumen
- [ ] GitHub-Repo auf **privat** stellen oder beim GitHub-Support alte Commits entfernen lassen (Historie wurde am 04.10. umgeschrieben, alte SHAs sind auf GitHub evtl. noch abrufbar)
- [ ] Dunkelmodus-Kontrast der Sunny’s-Liederlade-Kachel (lila → grau); ggf. andere Logo-Variante
- [ ] SSH-Key-Login zum Server einrichten (aktuell Passwort aus `.env.local`)
- [ ] `deploy/apply-*.sh` sind Einmal-Skripte; bei Bedarf in Doku/`agent.md` aufnehmen
- [ ] Bildnachweis „Porträtfotos: Edi Haberl“ im `vorstand.astro` in ein Fragment packen (optisch egal)

---

## Erledigt

### Fundament & Migration (14.–16.09.)
- [x] Astro + Tailwind v4 + Zod + Nano Stores + Orbiter-CMS aufgesetzt, `output: 'server'`
- [x] Plan, Design-Tokens, Barrierefreiheits-Palette (AAA-Kontraste, getestet)
- [x] Migration aus dem WordPress-Dump: 207 Medien, 13 Seiten, 25 Blogeinträge, Oxygen-Inhalte extrahiert
- [x] Alle Routen: Seiten, Blog, Events, Archiv, Partner, Downloads
- [x] Header mit Navigation, Barrierefreiheits-Panel, Befehlspalette
- [x] Hero mit animiertem Logo, Inhalte-Durchgang

### Design & Funktion (17.–23.09.)
- [x] Dunkelmodus, SEO/Favicon/OG-Bild, Cookie-Hinweis, Seitenübergänge
- [x] „Unsere Mitglieder“ (Logo-Wand), „Unsere Unterstützer“ (Stadt Graz), Social-Links
- [x] Barrierefreiheit: Lesehilfe, Leicht-Lesen-Umschalter, Erklärung zur Barrierefreiheit, Doku
- [x] Performance: lokale Schriften, optimierte Logos; Lighthouse-A11y 100
- [x] Datenschutzerklärung und Cookie-Richtlinie
- [x] Server-Betrieb: Deployment auf `preview.kuin.at`, Build auf dem Server, geteilte DB mit `api.kuin.at`
- [x] Orbiter-Tutorial (`/documentation`)

### Inhalte (01.10.)
- [x] Alt-Texte: 193 Medien, 0 Bilder ohne Alt
- [x] Echter Vorstand laut Vereinsregister
- [x] Partner-Logos komplett (Oper Graz, Klavierhaus Fiedler, Sunny’s Liederlade, aXe, Popella)
- [x] Events Herbst 2026 (MUT-Workshop, Konferenz, Oper Graz), Newsletter Okt–Dez 2026
- [x] Jahresbericht 2025 als Download, Galerie/Veranstaltungen/Kuin/Programm 2026 unveröffentlicht
- [x] Drafts sind per Direkt-URL nicht mehr erreichbar (404), eigene 404-Seite
- [x] Menü: Veranstaltungen direkt, Newsletter unter Archiv, Navigation zentral in `src/lib/nav.ts`
- [x] Orbiter auf aktuelle Versionen aktualisiert

### Seit 02.10.
- [x] Preview aus Suchmaschinen ausgeschlossen (04.10.): `robots.txt` als Route (Host `preview.*` → `Disallow: /`), Meta `noindex, nofollow`; Canonical zeigt auf `kuin.at`
- [x] Git-Historie bereinigt (04.10.): Server-IP, Subscription-User, Key-Name, fremde Accounts und versehentlich committete `content.pod-shm/-wal` entfernt; Details jetzt in der gitignorierten `SERVER.local.md`; Backup `~/kuin-at-pre-rewrite-2026-10-04.bundle`
- [x] `agent.md`/`stage.md` bereinigt: Server-IP, Subscription-User, Key-Name und fremde Accountnamen entfernt (Repo ist öffentlich); Variablen heißen jetzt `PLESK_*`
- [x] Link auf die Stadt-Graz-Inklusionsveranstaltungen (Sticker auf `/events`, Link im Footer)
- [x] Footer neu: Statement, Buttons, „Entdecken“-Spalte, schlanke Fußleiste mit Rechtlichem und Darstellung-Umschalter
- [x] Startseite: Archiv-Link repariert (404 → `/archiv/3-spaziergang-2025`), Gruppenfoto als Vorschau
- [x] Team: Anita Brodtrager („Mag.a … , BA“) und Edi Haberl („Fotos, Videos“) eingetragen
- [x] Titel „Mag.a“ mit hochgestelltem a (Sibylle Dienesch, Susanne Maurer-Aldrian, Angela Fink)
- [x] Neues Popella-Logo (scharf, richtiges Seitenverhältnis)
- [x] Vorstandsfotos von Edi Haberl (Gerwin Weiher, Matthias Grasser, Sibylle Dienesch, Ursula Vennemann) inkl. Bildnachweis
- [x] Skripte für Live-Änderungen: `deploy/deploy.sh`, `deploy/apply-script.sh` (mit Sicherung der Live-DB)
- [x] Lokaler Dev-Server mit Kopie der Live-DB (ändert nie die Live-Daten)
