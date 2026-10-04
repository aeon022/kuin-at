# kuin.at — Kultur Inklusiv Graz

Relaunch der Website von **Kultur Inklusiv (KUIN)**, dem Netzwerk für barrierefreie Kulturerlebnisse in Graz.
Umbau von WordPress/Oxygen auf einen schnellen, barrierefreien Stack mit Redaktionssystem im Browser.

- **Vorschau:** <https://preview.kuin.at>
- **Redaktion (Orbiter-Admin):** `api.kuin.at`, Anleitung für Redakteur:innen: [`docs/tutorial-orbiter/README.md`](docs/tutorial-orbiter/README.md)
- **Live:** `kuin.at` zeigt noch die statische Coming-Soon-Seite (`coming-soon/`), bis der Go-live erfolgt.

## Stack

| Was | Womit |
|---|---|
| Framework | [Astro](https://astro.build) 7, `output: 'server'` (Node-Adapter) |
| Styling | Tailwind CSS v4 |
| Typen / Validierung | TypeScript + Zod (Schemas in `src/schemas/`) |
| CMS | [Orbiter](https://orbiter.sh) — SQLite-Datei `content.pod` als Single Source of Truth |
| Globaler Zustand | Nano Stores (Leicht-Lesen, Theme, Barrierefreiheit) |
| Hosting | Plesk + Phusion Passenger |

Ziele: **WCAG 2.1 AAA**, ein **„Leicht Lesen“-Schalter** (einfache Sprache), Dunkelmodus, kaum Abhängigkeiten.

## Lokal starten

Voraussetzung: **Node 22** (`engines` verlangt ≥ 22.12; `better-sqlite3` ist gegen die installierte Node-Version gebaut — bei einer anderen Version `npm rebuild better-sqlite3`).

```bash
npm install
npm run dev        # http://localhost:4321
```

Der Dev-Server liest die lokale `./content.pod`. Die gehört nicht ins Git. Für echte Inhalte eine **Kopie** der Live-DB holen
(Datei `api.kuin.at/content.pod`, nur herunterladen!). Lokale Änderungen daran erreichen die Live-Seite **nie**: Das Deployment
überträgt keine `*.pod`-Dateien.

Weitere Befehle: `npm run build`, `npm run admin` (lokale Orbiter-Admin-UI auf der lokalen DB), `npx astro check`.

## Projektstruktur

```
src/
  pages/        Routen (Start, events, archiv, partner, downloads, der-verein, blog, 404, Rechtliches …)
  components/   Header, Footer, Hero, Partner/Supporters-Logowände, EventCard, PersonCard, …
  layouts/      Layout.astro
  lib/          nav.ts (Menü, einmal definiert), eventTime.ts, content.ts, contrast.ts (+ Tests)
  schemas/      Zod-Schemas der Orbiter-Collections (Pages, Events, Blog, Archive, Partners, Downloads, People)
  store/        Nano Stores: leichtLesen, theme, accessibility
scripts/
  migrate/      Einmal-Skripte für Inhalte (idempotent) + Assets, `run.ts` = WordPress-Migration
coming-soon/    statische Seite für kuin.at bis zum Go-live
deploy/         Deploy- und Live-Änderungs-Skripte (siehe unten)
docs/           Barrierefreiheit, Orbiter-Anleitung, Umsetzungsplan
```

## Inhalte und die Datenbank

Alle Inhalte (Seiten, Events, Blog/Newsletter, Archiv, Partner, Downloads, Personen) liegen in Orbiter. Redakteur:innen pflegen sie im
Admin; **Änderungen sind sofort live**. Medien (Bilder, PDFs) liegen ebenfalls in der DB, Alt-Texte sind Pflicht.

**Wichtig:** `content.pod` ist **nur auf dem Server** maßgeblich (`api.kuin.at/content.pod`). Site und Admin lesen dieselbe Datei.
Sie wird nie deployt, nie committet, nie überschrieben.

### Änderungen an der Live-DB per Skript

Strukturelle oder gesammelte Inhaltsänderungen laufen über idempotente Skripte in `scripts/migrate/`:

1. Skript schreiben (zuerst lokal gegen die Kopie testen: `node --import tsx scripts/migrate/<x>.ts`).
2. **Immer mit vorheriger Sicherung** live ausführen:
   ```bash
   bash deploy/apply-script.sh scripts/migrate/<x>.ts [weitere Dateien, die das Skript liest]
   ```
   Das Skript legt `content.pod.bak-pre-<skript>-<datum>` an, führt es auf dem Server aus und startet die App neu.
3. Skript committen (Doku, was wann geändert wurde).

**Externes Backup:** `bash deploy/pull-pod.sh` lädt die Live-DB (nur Download) nach `~/Backups/kuin/`, prüft sie und behält die letzten 10 Kopien. Vor größeren Änderungen und regelmäßig ausführen.

## Deployment

```bash
bash deploy/deploy.sh      # rsync des Codes → Build auf dem Server → Neustart → Statuscheck
```

- Der **Build läuft auf dem Server**, nicht lokal: Orbiter backt den DB-Pfad in das Bundle, ein lokaler `dist/` hätte einen Pfad, den es dort nicht gibt (führte am 22.09.2026 zu einem Ausfall).
- Nicht übertragen werden `node_modules`, `.git`, `dist`, `*.pod`, `import-source`, `.env*`, `.claude`.
- Zugang: SSH-Alias `kuin-server`; falls der Key abgelehnt wird, nutzt das Skript `PLESK_PASSWORD` aus `.env.local`.
- Details zu Passenger, Neustart, Logs und der Admin-App: [`agent.md`](agent.md) → „Deployment / Server-Betrieb“.

## Was bewusst nicht im Repo liegt

| Datei/Ordner | Warum |
|---|---|
| `content.pod`, `*.pod*` | Datenbank mit allen Inhalten (nur Server) |
| `.env`, `.env.local` | Zugangsdaten (`PLESK_HOST`, `PLESK_USER`, `PLESK_PASSWORD`) |
| `import-source/` | WordPress-Export (SQL-Dump + Uploads) für die Migration |
| `# assets/` | Rohmaterial (Logos, Fotos) — optimierte Versionen liegen in `scripts/migrate/assets/` |
| `.claude/` | lokale Sitzungsdaten |

## Weiterführend

- [`roadmap.md`](roadmap.md) — To-dos: Offenes bis zum Go-live und alles Erledigte (abgehakt)
- [`stage.md`](stage.md) — ausführliches Protokoll aller Entscheidungen und Zwischenfälle
- [`agent.md`](agent.md) — Spezifikation, Schemas, Server- und Deploy-Details
- [`design-konzept.md`](design-konzept.md) — Designkonzept („Playful Minimalism“)
- [`docs/barrierefreiheit.md`](docs/barrierefreiheit.md) — Barrierefreiheit der Website
