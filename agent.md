# Projektkontext: kuin.at (Kultur Inklusiv) Relaunch

## STRICT AGENT INSTRUCTIONS (ANTI-HALLUZINATION)
1. **Design-Vorlagen (Mockup first):** Du darfst KEIN EIGENES DESIGN und KEINE EIGENEN LAYOUTS erfinden. Richte dich zu 100% nach den bereitgestellten HTML-Mockups oder den genauen Klassen aus `design-konzept.md`. Jede Abweichung vom vorgegebenen Design-System (Ma, Kanso) ist ein Fehler.
2. **Tailwind v4 Zwang:** Die Nutzung einer `tailwind.config.js` ist strikt verboten. Alle Theme-Erweiterungen müssen über die `@theme` Direktive in der globalen CSS-Datei erfolgen.
3. **Komponenten-Treue:** Wenn du ein HTML-Mockup in Astro-Komponenten zerlegst, darfst du keine HTML-Tags ändern, keine Tailwind-Klassen weglassen und keine künstlichen Wrapper-`<div>`s hinzufügen. Nutze striktes, semantisches HTML[cite: 1].


## Vision & Ziel
Umbau der bestehenden WordPress/Oxygen-Website von "Kultur Inklusiv Graz" auf einen modernen, pfeilschnellen und 100% barrierefreien Tech-Stack. Die Website muss Inklusion atmen – sowohl technisch als auch inhaltlich. 

## Tech-Stack (Less Noise. Nice Data. No Bloat.)
- **Framework:** Astro (SSG / SSR für Live-Daten)
- **Styling:** Tailwind CSS v4
- **Typisierung:** TypeScript + Zod
- **Backend/CMS:** Orbiter (orbiter.sh) als Headless CMS
- **State Management:** Nano Stores (für den globalen "Leicht Lesen"-Toggle)

## Design- & Migrations-Vorgaben
- **Datenquelle (`import-source`):** Der Agent nutzt die WordPress-Exportdaten im Ordner `import-source`, um Farben, Texte und Medien zu extrahieren.
- **Design:** Das neue Design soll modern, reduziert ("No Bloat") und hochgradig inklusiv sein. Die alten WordPress-Farben werden extrahiert und als Basis für das Tailwind v4 Theme genutzt (angepasst für optimale Kontraste).
- **Medien-Migration:** Bilder und Dokumente aus `import-source` müssen programmatisch in Orbiter hochgeladen werden. Bildbeschreibungen (Alt-Texte) sind ein kritischer Faktor und müssen zwingend in Orbiter mitgespeichert werden.

## Kernanforderungen
1. **100% Barrierefreiheit (WCAG 2.1 AAA):**
   - Striktes, semantisches HTML (`<main>`, `<article>`, `<nav>`, etc.).
   - Alle interaktiven Elemente müssen über die Tastatur bedienbar sein (`focus-visible:ring` ist Pflicht).
   - Zwingende `alt`-Texte für alle Bilder. Kontrastwerte müssen AAA-Standards entsprechen.
2. **"Leicht Lesen" (LL) Funktion:**
   - Ein globaler Schalter in der UI, der die Textkomplexität reduziert.
   - Wenn LL aktiviert ist, wird das Feld `content_leicht_lesen` statt `content_standard` gerendert.
3. **Live-Daten Integration:**
   - Orbiter spielt die Daten über die API/SDK live ein. Schemas in Orbiter sind die Single Source of Truth.

## Orbiter Daten-Schemas (Zod / TypeScript Definitionen)

Alle Schemas müssen ein "Standard"-Feld und ein "Leicht Lesen"-Feld (wo sinnvoll) aufweisen.

### 1. Pages (Seiten)
Für "Über uns", "Manifest", "Barrierefreiheitserklärung".
- `title`: String
- `slug`: String (Unique)
- `content_standard`: Rich Text / Block Editor
- `content_leicht_lesen`: Rich Text / Block Editor (Optional)
- `seo_description`: String

### 2. Events (Veranstaltungen & Walks)
- `title`: String
- `slug`: String
- `start_date`: DateTime
- `end_date`: DateTime
- `location`: String (Adresse oder Treffpunkt)
- `description_standard`: Rich Text
- `description_leicht_lesen`: Rich Text
- `accessibility_features`: Array of Strings (z.B. "Gebärdensprache", "Rollstuhlgerecht")
- `gallery_id`: Relation (Optional)

### 3. Blog (News & Updates)
- `title`: String
- `slug`: String
- `published_at`: DateTime
- `cover_image`: Image (zwingend `alt_text` erforderlich)
- `content_standard`: Rich Text
- `content_leicht_lesen`: Rich Text

### 4. Archive (Galerien)
Rückblicke auf vergangene Walks.
- `title`: String
- `year`: Number
- `description`: Text
- `images`: Array of Objects (`{ image_url, alt_text, caption }`)

### 5. Partners (Netzwerk & Mitglieder)
- `name`: String
- `logo`: Image (zwingend `alt_text` erforderlich)
- `website_url`: String
- `description`: Text
- `is_board_member`: Boolean (Vorstand vs. normales Mitglied)

### 6. Downloads
- `title`: String
- `file`: File
- `description`: Text

## Entwicklungsrichtlinien
- Erstelle keine eigenen, überladenen UI-Bibliotheken, nutze das native HTML/CSS über Tailwind v4.
- Keine "div-Suppe". Nutze das korrekte HTML-Tag für den jeweiligen Job.
- Überlege bei jeder UI-Komponente zuerst, wie ein Screenreader sie vorlesen würde.

## Deployment / Server-Betrieb

Server: Plesk + Phusion Passenger, SSH-Alias `kuin-server` (`~/.ssh/config`,
`37.252.190.170`). Drei vhosts unter `/var/www/vhosts/kuin.at/`:
- `preview.kuin.at` — diese Astro-Site
- `api.kuin.at` — `@a83/orbiter-admin` CLI (Orbiter-CMS-Backend/Admin-UI)
- `kuin.at` (`httpdocs`) — noch die alte WordPress-Produktion, bis zum Go-Live

### Wie die Astro-Site läuft
- `preview.kuin.at`'s Anwendungsverzeichnis ist ein **vollständiger Projekt-Checkout**
  (nicht nur ein hochgeladener `dist/`-Ordner) — `src/`, `public/`, `scripts/`, `docs/`,
  `node_modules/`, `package.json` etc. liegen dort genau wie lokal.
- Passenger startet über `app.js` im Anwendungsroot, das ist `deploy/preview-app.js`:
  lädt per `import('./dist/server/entry.mjs')` den von `@astrojs/node` (Standalone-Modus)
  gebauten Server (`astro.config.mjs`: `output: 'server'`, `adapter: node({ mode: 'standalone' })`).
- **Build MUSS auf dem Server selbst laufen, nicht lokal + hochladen.** Grund: Orbiter
  löst den `pod`-Pfad (`orbiter({ pod: './content.pod' })`) zur **Build-Zeit** relativ zu
  `config.root` auf (`node_modules/@a83/orbiter-integration/src/index.js:284`,
  `resolve(config.root.pathname, podPath)`) und backt den absoluten Pfad als String-Literal
  in den kompilierten Server-Code ein. Ein lokal gebauter `dist/`-Ordner enthält also z.B.
  `/Users/<user>/Sites/kuin.at/content.pod` — auf dem Linux-Server nicht vorhanden →
  `TypeError: Cannot open database because the directory does not exist` auf **jeder** Seite,
  die Orbiter-Daten lädt (praktisch die ganze Site). Real passiert am 2026-09-22, siehe
  `stage.md`-Log — kurzer kompletter Ausfall von preview.kuin.at, durch Rebuild auf dem
  Server behoben.
- Node-Version über `.node-version` (Inhalt: `25`) vorgegeben; Plesk stellt Binaries unter
  `/opt/plesk/node/<version>/bin/node` bereit — **nicht** im PATH einer nicht-interaktiven
  SSH-Session (`PATH=/opt/plesk/node/25/bin:$PATH` voranstellen oder Binary direkt aufrufen).
- `content.pod` (SQLite, gitignored) liegt direkt im Anwendungsroot, wird nicht über Git
  transportiert — enthält Live-CMS-Daten, beim Deploy niemals überschreiben.
- `.env` auf dem Server enthält nur `PUBLIC_ORBITER_ADMIN_URL` — kein `ORBITER_POD` (das
  ist nur für die separate Admin-App relevant, siehe unten).
- Restart: `touch tmp/restart.txt` im Anwendungsroot (Standard-Passenger-Mechanismus).
- Logs: `/var/www/vhosts/kuin.at/logs/preview.kuin.at/{error_log,access_ssl_log}` — der
  Apache-`error_log` zeigt i.d.R. **keine** Node/App-Stacktraces (nur ModSecurity/Proxy-
  Fehler wie `AH01071: Got error 'Primary script unknown'`). Um echte App-Fehler zu sehen,
  den Server im Vordergrund starten und die Route direkt anfragen:
  `PATH=/opt/plesk/node/25/bin:$PATH /opt/plesk/node/25/bin/node app.js`.

### Deploy-Ablauf (Stand 2026-09-22)
1. Lokal nichts bauen — der Server baut selbst.
2. Quellcode syncen (rsync, **kein** `--delete`, server-only Dateien ausschließen):
   ```
   rsync -avz --exclude 'node_modules/' --exclude '.git/' --exclude '.astro/' \
     --exclude 'content.pod' --exclude '*.pod' --exclude 'import-source/' \
     --exclude 'orbiter-env.d.ts' --exclude '.env' --exclude '.env.example' \
     --exclude 'tmp/' --exclude '.superpowers/' \
     ./ kuin-server:/var/www/vhosts/kuin.at/preview.kuin.at/
   ```
3. Auf dem Server bauen:
   ```
   ssh kuin-server "cd /var/www/vhosts/kuin.at/preview.kuin.at && \
     PATH=/opt/plesk/node/25/bin:\$PATH /opt/plesk/node/25/bin/node \
     /opt/plesk/node/25/lib/node_modules/npm/bin/npm-cli.js run build"
   ```
4. Passenger neu starten: `ssh kuin-server "touch /var/www/vhosts/kuin.at/preview.kuin.at/tmp/restart.txt"`
5. Verifizieren: `curl -sI https://preview.kuin.at/` und die konkret geänderten Routen.
6. Vor einem `npm install`-Schritt lohnt sich ein Hash-Vergleich von `package-lock.json`
   (lokal `shasum`/`md5`, remote `md5sum`) — bei Übereinstimmung ist `node_modules` auf dem
   Server bereits aktuell, kein Install nötig.

### Wie die Admin-App (api.kuin.at) läuft
- Passenger-`app.js` = `deploy/api-app.js`, startet `@a83/orbiter-admin`'s CLI
  (`import('@a83/orbiter-admin/src/cli.js')`).
- Setzt `ORBITER_POD` (Pfad zu `content.pod`, relativ zu `__dirname`) und `ADMIN_ORIGIN`
  (CSRF-Allowlist: `https://api.kuin.at,https://preview.kuin.at,https://kuin.at`) direkt im
  Code, nicht über Plesk-Env-Variablen — laut Kommentar dort bewusst so, "damit der Deploy
  in den Dateien bleibt, die Claude per SSH hochladen kann".
