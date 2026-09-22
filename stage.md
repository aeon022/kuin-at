# kuin.at — Stage / Progress Log

Living progress tracker so context survives across sessions. Full implementation
plan (read this first for any "why"): `docs/superpowers/plans/2026-09-14-kuin-relaunch.md`.
Spec: `agent.md`.

## Status
- **Current task:** all 13 tasks complete. The final whole-branch code review
  passed; its critical/important findings were fixed in this session (blog
  500s, missing `.prose` typography, dead Leicht-Lesen toggle, missing footer,
  embedded legacy WP media URLs, CMS-data hardening on all content routes).
  The site is being prepared for launch.
- **Blockers:** none.
- **Deployment note:** full server-ops writeup now lives in `agent.md`'s
  "Deployment / Server-Betrieb" section (Plesk/Passenger, SSH alias
  `kuin-server`, why the build must run on the server, restart mechanism,
  the api.kuin.at admin app). Short version: `content.pod` is gitignored and
  lives only on the server (never overwrite it on deploy); the site must be
  **built on the server itself**, not locally + uploaded — Orbiter bakes the
  resolved `pod` path into the compiled bundle at build time, so a locally
  built `dist/` carries a dev-machine path that doesn't exist on the server
  (caused a full-site outage on 2026-09-22, see Log).
- **Execution mode:** subagent-driven (user chose this explicitly). No git worktree — repo had zero commits so there was nothing to isolate from; working directly in `/Users/gweiher/Sites/kuin.at` on branch `build/kuin-relaunch` (created in Task 1, not on a `main`/default branch).

## Key decisions (don't re-derive these — grounded in actual files, not guesses)

- **Orbiter is real and already published:** `@a83/orbiter-core@0.3.14`,
  `@a83/orbiter-integration@0.3.18`, `@a83/orbiter-admin@0.3.81` are live on npm
  (verified via `npm view`). Source/docs at `~/Developing/Projects/orbiter`
  (`AI_SETUP.md` = working scaffold recipe, `ORBITER_CONTEXT.md` = field types
  + DB methods + API routes, `packages/admin/src/wp-importer.js` = existing
  WP-XML importer whose conventions we mirror for our own SQL-dump importer).
- **`output: 'server'`** is mandatory in `astro.config.mjs` — confirmed gotcha
  in ORBITER_CONTEXT.md §10.1, needed for live Orbiter reads.
- **Brand palette**, read from the legacy dump, not invented:
  - rose `#cc5972`, teal `#65bec2`, slate `#566d8f` — recurring nav-menu
    customizer hover/current-item colors (`wp_options` theme_mods + Automatic.css
    `automatic_css_settings`).
  - ink `#2f201a` / `#3d2e2d` — dark neutral pair used site-wide.
  - AAA-safe darkened text twins (`rose-700` `#7a2f42`, `teal-700` `#1f5a5c`,
    `slate-700` `#32415a`) are *derived*, not from the source — verified ≥7:1
    against bg `#fdfcfb` by `src/lib/contrast.ts`'s test in Task 2.
- **Legacy content reality** (counted directly from
  `import-source/wp_9bhnv_2026-09-14_13-30-44.sql`, prefix `bPIMSIHdV_`):
  13 pages, 25 posts, 207 attachments, 77 revisions, 1 ACF field group (barely used).
  Only **14 of 207 attachments** have existing `_wp_attachment_image_alt` —
  everything else needs the `[ALT-TEXT TODO]` placeholder path.
  Body content for all 12 real pages lives in **Oxygen-builder JSON**
  (`_ct_builder_json` postmeta, a structured component tree) — `post_content`
  is empty for every single one. **Revised from the original plan:** the user
  explicitly asked for everything out of Oxygen, properly — so Task 6 is a
  real tree-walking extractor (`parseOxygenTree.ts`), not a placeholder
  fallback. It was built against the full, surveyed component vocabulary (21
  distinct component types site-wide, checked during planning, not guessed).
  Genuine, unavoidable gaps are flagged in `needsReview`, never silently
  dropped: raw shortcodes (Kontakt page's form, Complianz cookie-policy
  embeds) can't be statically rendered; one dynamic posts-grid widget is
  superseded by the new `/blog` route rather than ported; blog posts (25 WP
  `post` rows) don't use Oxygen at all — confirmed no `post`-type row has a
  `_ct_builder_json` entry — so they still go through plain `post_content`.
- **Events / Archive / Partners have no structured legacy data** — these are
  net-new Orbiter collections. Partner logos (Bruecke, Universalmuseum
  Joanneum, Graz Museum, Kunsthaus Graz, mezzanin theater, schauspielhaus,
  salon stolz, pupella, inTakt, KunstUniGraz...) already exist as SVGs in
  `import-source/uploads/2025/02/` — good starting point for manually
  populating the Partners collection after migration.
- **No native "repeater" field type in Orbiter** — Archive's
  `images: [{image_url, alt_text, caption}]` is stored as a JSON array in an
  `array`-typed field; Orbiter admin will edit it as raw JSON. Documented
  limitation, not a gap to build custom tooling for.
- **Orbiter's entry `slug`** (2nd arg to `createEntry`) is the canonical slug —
  agent.md's schema tables list `slug` as a data field, but we do not duplicate
  it inside `data`; every schema/route treats the entry identity as the slug.
- **Media-reference fields are plain Orbiter media-id strings, not inline
  `{url, alt_text}` objects.** Caught during the pre-execution plan scan:
  Task 3's original schemas modeled `BlogPost.cover_image`,
  `Partner.logo`, `Download.file` as embedded objects, but Orbiter's
  `image`/`media` field types actually store just a media-id reference (the
  migration script already did this correctly; the schemas were wrong).
  Fixed schemas to `z.string().min(1)`; routes resolve `{url, alt, filename}`
  at render time via `getMediaItem` from the `orbiter:media` virtual module
  (confirmed present in `@a83/orbiter-integration`'s source — no custom
  helper needed). Archive's `images` array is unaffected — it's a generic
  JSON `array` field, not an Orbiter media reference, so inline
  `{image_url, alt_text, caption}` objects there are correct as originally planned.
- **Test strategy:** Node's built-in `node:test` + `tsx` as the only new dev
  dependency (no Jest/Vitest) — pure functions (contrast math, SQL tuple
  parsing, content transforms, the Leicht-Lesen resolver) get real unit tests;
  UI/accessibility gets a documented manual keyboard-and-screenreader check
  per task instead of a browser-automation framework we don't otherwise need.

## Log

- 2026-09-14 — Read `agent.md`, surveyed `import-source/` (SQL dump + 133MB
  `uploads/`, 971 media files), cross-referenced the real Orbiter monorepo at
  `~/Developing/Projects/orbiter` for actual API shape, extracted real brand
  colors from the dump. Wrote full implementation plan:
  `docs/superpowers/plans/2026-09-14-kuin-relaunch.md` (12 tasks). Created
  this file. Repo is not yet a git repo — Task 1 Step 10 runs `git init`.
- 2026-09-14 — User chose subagent-driven execution and asked for full,
  proper Oxygen content extraction ("alle Daten aus Oxygen raus und perfekt
  im neuen Projekt"). Surveyed every Oxygen component type site-wide
  (`ct_headline`, `ct_text_block`, `ct_image`, `ct_link_text/button`,
  `ct_span`, `ct_shortcode`, `oxy_posts_grid`, `oxy_rich_text`, layout/nav
  wrappers) by walking real `_ct_builder_json` blobs from every page.
  Revised the plan: inserted a new Task 6 (`parseOxygenTree.ts` — real
  extractor, not a placeholder), renumbered Tasks 6–12 to 7–13, rewrote
  Task 7 (`transformContent.ts`) to consume the extractor, rewrote Task 9
  (orchestrator) to wire an alt-text resolver from the media migration step
  into the extractor. Plan is now internally consistent at 13 tasks.
- 2026-09-14 — Task 1: Astro + Tailwind v4 + Zod + Nano Stores + Orbiter scaffolded. `npm run build` green.
- 2026-09-14 — Task 9: migration orchestrator (`scripts/migrate/run.ts`) implemented
  and run for real against `import-source/`. Real counts: **207 original media
  files** uploaded (971 total media-extension files in `uploads/` minus 764
  WP-generated resize variants like `-150x150`/`-300x212` — the plan's
  "~764 original files" estimate had this backwards; 207 is the correct
  original count, cross-checked file-by-file), **13 pages** migrated (11
  published with real Oxygen-extracted content, 2 drafts — `landing-479`
  aka "Landing #3" and `privacy-policy` — flagged for review as planned),
  **25 blog posts** migrated. Spot-checked `kontakt` and `impressum` page
  content against the live kuin.at site — address, phone, email, and ZVR
  number match exactly. `npm run build` still green. 226 items landed in the
  review report (full list below).
  While wiring it up, found and fixed two real bugs in the orchestrator's
  media-to-post join (not in Tasks 4-8's code): attachment `guid` values are
  often pretty-permalink or `?attachment_id=N` URLs rather than the raw
  upload path, so matching alt text and blog cover images by `guid` silently
  missed the very attachments that *did* have legacy alt text (0/207 alt
  matches, 3/4 thumbnailed blog posts got no cover image). Switched both
  lookups to the `_wp_attached_file` postmeta key, which always holds the
  real relative path — recovered 14 real alt texts and 4/4 blog cover images.
  Also handled a genuine WP data quirk not covered by the brief's example
  code: two pages ("Landing", published, and "Landing #3", draft) share the
  post_name `landing` — WP allows this across statuses but Orbiter enforces
  unique slugs, so the draft is auto-renamed to `landing-479` with a review
  note.
- 2026-09-14 — Task 13 (final task): built the last 3 listing pages —
  `/archiv`, `/partner`, `/downloads` — completing the full route set (Pages,
  Blog, Events, Archive, Partners, Downloads) planned across all 13 tasks.
  `/archiv` reads the `archive` collection directly (images carry their own
  `image_url`/`alt_text` per `ArchiveSchema`, no media-id resolution needed).
  `/partner` and `/downloads` resolve `Partner.logo`/`Download.file`
  media-id strings via `getMediaItem` (`orbiter:media`), same pattern as
  Task 12's blog cover image, with a `[ALT-TEXT TODO: Bild manuell
  beschreiben]` fallback so every `<img>` alt stays non-empty. All three
  Orbiter collections are genuinely empty right now (no legacy structured
  data for Archive/Partners/Downloads — the WP pages were intro text only,
  already migrated into Pages in Task 9); each route's `.map()` over an
  empty array renders an empty section rather than crashing, same guarantee
  Task 12 already proved live for `/events`. `npm run build` green
  (confirmed twice, foreground, exit code 0). Live dev-server curl
  verification of the empty-state render was attempted but the sandbox's
  background-task/monitor notification channel repeatedly stalled against
  Astro 7's own dev-server daemon (its agent-auto-detected background mode
  imposes a hard 30s startup timeout, shorter than this project's Orbiter
  pod load time) — root-caused to `node_modules/astro/dist/cli/dev/index.js`
  (`isRunByAgent()` → background mode → `node_modules/astro/dist/cli/server.js`'s
  30s watchdog), not to the new page code. Substituted a static build pass
  plus line-by-line inspection of all three files against the brief (which
  specifies their exact contents) instead. This closes the 13-task
  kuin-relaunch plan.

## Remaining manual work (fills in as migration runs — empty until Task 9)

- [ ] Fill in `[ALT-TEXT TODO]` placeholders across migrated media — 193 media
      files have no alt text in the legacy WP data (full filename list in the
      migration review report below; rerun `npm run migrate` to reproduce).
- [ ] Rewrite Oxygen-only pages flagged `needsReview` by `transformPage`.
- [x] ~~Populate Partners~~ — done: 16 real entries (15 recovered from the
      legacy homepage's "Netzwerk" section via the parseOxygenTree.ts
      image-reference bugfix, plus Oper Graz, see below). Archive is still
      empty (genuinely no legacy source data — the old `archive` custom
      taxonomy was never populated).
- [ ] **Events (2026-09-14):** 1 real event added —
      `events/kuin-unterwegs-in-graz-2026-09` ("KUIN – Unterwegs in Graz",
      25.9.2026, extracted from the flyer image
      `import-source/uploads/2026/07/KUIN-Programm-2026.jpg` via
      `scripts/migrate/add-real-event.ts`). That same flyer lists 3 further
      "Vorschau" (save-the-date) items with no time or location given —
      **not** added as full Events, since inventing a time would
      misrepresent them as confirmed:
      - Sa., 24.10.2026 — KUIN Workshoptag für Kinder und Jugendliche
      - Mi., 11.11.2026 — KUIN Konferenz zur kulturellen Teilhabe von
        Kindern und Jugendlichen mit Behinderungen (KUG Brandhofgasse)
      - Mi., 9.12.2026 — KUIN – Unterwegs in der Oper Graz
      Add these via the Orbiter admin once the client confirms time/location.
- [ ] Verify Downloads beyond `KUIN-Manifest.pdf` (only clear candidate found
      in `import-source/uploads/`).
- [ ] **Partner-Logos (client mail, "DRINGEND"):** Oper Graz is **done** —
      added as a published `partners` entry (`oper-graz`) with the real logo
      from `import-source/mail/OperGraz_Logo_SCHWARZ_RGB.png` and alt text
      "Logo der Oper Graz" via `scripts/migrate/add-partner-logos.ts`.
      **Sunny's Liederlade** and **Klavierhaus Fiedler** are still open: the
      client has not supplied logo files for either. Once a file arrives, add
      it to the `PARTNERS` array in that script and re-run (it's idempotent),
      or add the entry by hand in the Orbiter admin.
- [ ] **Jahresberichte:** `/archiv`'s third section renders the existing
      `downloads` collection — the client adds each annual report as a
      Downloads entry via the Orbiter admin. If the volume ever grows past a
      handful, a dedicated `reports` collection (with a `year` field for
      sorting) would be worth a proper schema task.
- [ ] **Galerie:** the client asked for Galerie to be removed. The new site
      never linked it — `grep -rni "galerie" src/` returns nothing, and no
      migrated page/blog body links to it either. The migrated page entry
      `pages/galerie` is still **published**, so `/galerie` is reachable by
      direct URL and appears in Orbiter's generated sitemap. Deleting content
      is the client's call: unpublish it in the Orbiter admin to remove it
      fully (the historical content stays in the pod).
- [ ] **Kontakt page (user request 2026-09-14):** add board members to the
      Partners collection with `is_board_member: true` so the live-pulled
      list on the Kontakt page (Task 12) isn't empty; add a board photo
      directly into the Kontakt page's rich-text content via the Orbiter
      admin. Contact block (Anita Brodtrager / office@kuin.at) is already
      hardcoded into the Kontakt route — no action needed there.
- [ ] **Inline images in migrated blog post bodies have empty `alt=""`**
      (found during Task 12's review, **corrected 2026-09-14 after the final
      review**) — these are WordPress Gutenberg `wp-block-image` figures
      embedded directly in a post's `content_standard` HTML, separate from
      the post's cover image (which does get a real alt or a `[ALT-TEXT TODO]`
      placeholder via Task 8/9). **Corrected exposure: exactly 1 empty `alt=""`
      occurrence is in published content** (blog post `programm-2026`), not
      the ~137 originally implied. The 137-image post `kuin-spaziergang` is a
      **draft**, and `orbiter:collections` only ever serves `status:
      'published'` entries (verified in
      `node_modules/@a83/orbiter-integration/src/index.js:220`), so none of
      those are live. Counted directly against `content.pod`, published vs.
      draft. Still a real gap — agent.md requires alt text on every image —
      but a one-image one right now: fix `programm-2026`'s inline image via
      the Orbiter admin, and fix `kuin-spaziergang`'s 137 before publishing it.

## Post-review fix wave (2026-09-14)

- Legacy WP media URLs rewritten: `scripts/migrate/fix-legacy-media-urls.ts`
  ran against `content.pod` and replaced **209 embedded
  `https://kuin.at/wp-content/uploads/...` references across 26 entries**
  (pages `der-verein`, `kuin`, `landing` + 23 blog posts) with
  `/orbiter/media/<id>`; a re-query confirms **0 legacy URLs remain**. The
  script is idempotent and safe to re-run after any future migration.

- Client-requested IA changes (mail thread in `import-source/mail/`):
  nav item "Veranstaltungen" → **"Aktuell"** (`/aktuell`), a small hub page
  with the two requested categories (Veranstaltungen → `/events`,
  Newsletter → `/blog`); `/archiv` restructured into the three requested
  sections (Veranstaltungen | Newsletter | Jahresberichte).
  **Judgment call:** the "Veranstaltungen" archive section keeps rendering the
  `archive` collection (year galleries with photos) rather than querying past
  `events`, because the client described the archive as past events shown
  *with photos* — which is exactly what `ArchiveSchema` models. Past `events`
  entries remain listed on `/events`.
- Oper Graz added as a published partner with its real logo (see remaining
  manual work above).

## Migration review report (full, from the real `npm run migrate` run, 2026-09-14)

```
=== Migration report: 226 items need manual follow-up ===
 - media: KUIN-Logo.svg — no alt text in legacy data
 - media: KUIN-NEWSLETTER-JAeNNER-MAeRZ-2025.pdf — no alt text in legacy data
 - media: Kultur-inklusiv-April-bis-Juni-2024.pdf — no alt text in legacy data
 - media: Logo-KUIN.svg — no alt text in legacy data
 - media: NEWSLETTER-APRIL-2020-1.pdf — no alt text in legacy data
 - media: NEWSLETTER-APRIL-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-AUGUST-2020-1.pdf — no alt text in legacy data
 - media: NEWSLETTER-AUGUST-2020-2.pdf — no alt text in legacy data
 - media: NEWSLETTER-AUGUST-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-DEZEMBER-2019.pdf — no alt text in legacy data
 - media: NEWSLETTER-DEZEMBER-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-FEBRUAR-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-FEBRUAR-MAeRZ-2024.pdf — no alt text in legacy data
 - media: NEWSLETTER-JAeNNER-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-JULI-2020-1.pdf — no alt text in legacy data
 - media: NEWSLETTER-JULI-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-JUNI-2020-1.pdf — no alt text in legacy data
 - media: NEWSLETTER-JUNI-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-JUNI-JULI-2023.pdf — no alt text in legacy data
 - media: NEWSLETTER-MAI-2020-1.pdf — no alt text in legacy data
 - media: NEWSLETTER-MAI-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-MAeRZ-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-OKTOBER-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-SEPTEMBER-2020.pdf — no alt text in legacy data
 - media: NEWSLETTER-SEPTEMBER-DEZEMBER-2024-TP.pdf — no alt text in legacy data
 - media: KUIN-Manifest.pdf — no alt text in legacy data
 - media: Akademie-Graz.png — no alt text in legacy data
 - media: Bruecke-Logo-Transparent.svg — no alt text in legacy data
 - media: Bruecke-Logo.svg — no alt text in legacy data
 - media: Foto-10.jpg — no alt text in legacy data
 - media: Foto-100.jpg — no alt text in legacy data
 - media: Foto-101.jpg — no alt text in legacy data
 - media: Foto-102.jpg — no alt text in legacy data
 - media: Foto-103.jpg — no alt text in legacy data
 - media: Foto-104.jpg — no alt text in legacy data
 - media: Foto-105.jpg — no alt text in legacy data
 - media: Foto-106.jpg — no alt text in legacy data
 - media: Foto-107.jpg — no alt text in legacy data
 - media: Foto-108.jpg — no alt text in legacy data
 - media: Foto-109.jpg — no alt text in legacy data
 - media: Foto-11.jpg — no alt text in legacy data
 - media: Foto-110.jpg — no alt text in legacy data
 - media: Foto-111.jpg — no alt text in legacy data
 - media: Foto-112.jpg — no alt text in legacy data
 - media: Foto-113.jpg — no alt text in legacy data
 - media: Foto-114.jpg — no alt text in legacy data
 - media: Foto-115.jpg — no alt text in legacy data
 - media: Foto-116.jpg — no alt text in legacy data
 - media: Foto-117.jpg — no alt text in legacy data
 - media: Foto-118.jpg — no alt text in legacy data
 - media: Foto-119.jpg — no alt text in legacy data
 - media: Foto-12.jpg — no alt text in legacy data
 - media: Foto-120.jpg — no alt text in legacy data
 - media: Foto-121.jpg — no alt text in legacy data
 - media: Foto-122.jpg — no alt text in legacy data
 - media: Foto-123.jpg — no alt text in legacy data
 - media: Foto-124.jpg — no alt text in legacy data
 - media: Foto-125.jpg — no alt text in legacy data
 - media: Foto-126.jpg — no alt text in legacy data
 - media: Foto-127.jpg — no alt text in legacy data
 - media: Foto-128.jpg — no alt text in legacy data
 - media: Foto-129.jpg — no alt text in legacy data
 - media: Foto-13.jpg — no alt text in legacy data
 - media: Foto-130.jpg — no alt text in legacy data
 - media: Foto-131.jpg — no alt text in legacy data
 - media: Foto-132.jpg — no alt text in legacy data
 - media: Foto-133.jpg — no alt text in legacy data
 - media: Foto-134.jpg — no alt text in legacy data
 - media: Foto-135.jpg — no alt text in legacy data
 - media: Foto-136.jpg — no alt text in legacy data
 - media: Foto-137.jpg — no alt text in legacy data
 - media: Foto-14.jpg — no alt text in legacy data
 - media: Foto-15.jpg — no alt text in legacy data
 - media: Foto-16.jpg — no alt text in legacy data
 - media: Foto-17.jpg — no alt text in legacy data
 - media: Foto-18.jpg — no alt text in legacy data
 - media: Foto-19.jpg — no alt text in legacy data
 - media: Foto-2.jpg — no alt text in legacy data
 - media: Foto-20.jpg — no alt text in legacy data
 - media: Foto-21.jpg — no alt text in legacy data
 - media: Foto-22.jpg — no alt text in legacy data
 - media: Foto-23.jpg — no alt text in legacy data
 - media: Foto-24.jpg — no alt text in legacy data
 - media: Foto-25.jpg — no alt text in legacy data
 - media: Foto-26.jpg — no alt text in legacy data
 - media: Foto-27.jpg — no alt text in legacy data
 - media: Foto-28.jpg — no alt text in legacy data
 - media: Foto-29.jpg — no alt text in legacy data
 - media: Foto-3.jpg — no alt text in legacy data
 - media: Foto-30.jpg — no alt text in legacy data
 - media: Foto-31.jpg — no alt text in legacy data
 - media: Foto-32.jpg — no alt text in legacy data
 - media: Foto-33.jpg — no alt text in legacy data
 - media: Foto-34.jpg — no alt text in legacy data
 - media: Foto-35.jpg — no alt text in legacy data
 - media: Foto-36.jpg — no alt text in legacy data
 - media: Foto-37.jpg — no alt text in legacy data
 - media: Foto-38.jpg — no alt text in legacy data
 - media: Foto-39.jpg — no alt text in legacy data
 - media: Foto-4.jpg — no alt text in legacy data
 - media: Foto-40.jpg — no alt text in legacy data
 - media: Foto-41.jpg — no alt text in legacy data
 - media: Foto-42.jpg — no alt text in legacy data
 - media: Foto-43.jpg — no alt text in legacy data
 - media: Foto-44.jpg — no alt text in legacy data
 - media: Foto-45.jpg — no alt text in legacy data
 - media: Foto-46.jpg — no alt text in legacy data
 - media: Foto-47.jpg — no alt text in legacy data
 - media: Foto-48.jpg — no alt text in legacy data
 - media: Foto-49.jpg — no alt text in legacy data
 - media: Foto-5.jpg — no alt text in legacy data
 - media: Foto-50.jpg — no alt text in legacy data
 - media: Foto-51.jpg — no alt text in legacy data
 - media: Foto-52.jpg — no alt text in legacy data
 - media: Foto-53.jpg — no alt text in legacy data
 - media: Foto-54.jpg — no alt text in legacy data
 - media: Foto-55.jpg — no alt text in legacy data
 - media: Foto-56.jpg — no alt text in legacy data
 - media: Foto-57.jpg — no alt text in legacy data
 - media: Foto-58.jpg — no alt text in legacy data
 - media: Foto-59.jpg — no alt text in legacy data
 - media: Foto-6.jpg — no alt text in legacy data
 - media: Foto-60.jpg — no alt text in legacy data
 - media: Foto-61.jpg — no alt text in legacy data
 - media: Foto-62.jpg — no alt text in legacy data
 - media: Foto-63.jpg — no alt text in legacy data
 - media: Foto-64.jpg — no alt text in legacy data
 - media: Foto-65.jpg — no alt text in legacy data
 - media: Foto-66.jpg — no alt text in legacy data
 - media: Foto-67.jpg — no alt text in legacy data
 - media: Foto-68.jpg — no alt text in legacy data
 - media: Foto-69.jpg — no alt text in legacy data
 - media: Foto-7.jpg — no alt text in legacy data
 - media: Foto-70.jpg — no alt text in legacy data
 - media: Foto-71.jpg — no alt text in legacy data
 - media: Foto-72.jpg — no alt text in legacy data
 - media: Foto-73.jpg — no alt text in legacy data
 - media: Foto-74.jpg — no alt text in legacy data
 - media: Foto-75.jpg — no alt text in legacy data
 - media: Foto-76.jpg — no alt text in legacy data
 - media: Foto-77.jpg — no alt text in legacy data
 - media: Foto-78.jpg — no alt text in legacy data
 - media: Foto-79.jpg — no alt text in legacy data
 - media: Foto-8.jpg — no alt text in legacy data
 - media: Foto-80.jpg — no alt text in legacy data
 - media: Foto-81.jpg — no alt text in legacy data
 - media: Foto-82.jpg — no alt text in legacy data
 - media: Foto-83.jpg — no alt text in legacy data
 - media: Foto-84.jpg — no alt text in legacy data
 - media: Foto-85.jpg — no alt text in legacy data
 - media: Foto-86.jpg — no alt text in legacy data
 - media: Foto-87.jpg — no alt text in legacy data
 - media: Foto-88.jpg — no alt text in legacy data
 - media: Foto-89.jpg — no alt text in legacy data
 - media: Foto-9.jpg — no alt text in legacy data
 - media: Foto-90.jpg — no alt text in legacy data
 - media: Foto-91.jpg — no alt text in legacy data
 - media: Foto-92.jpg — no alt text in legacy data
 - media: Foto-93.jpg — no alt text in legacy data
 - media: Foto-94.jpg — no alt text in legacy data
 - media: Foto-95.jpg — no alt text in legacy data
 - media: Foto-96.jpg — no alt text in legacy data
 - media: Foto-97.jpg — no alt text in legacy data
 - media: Foto-98.jpg — no alt text in legacy data
 - media: Foto-99.jpg — no alt text in legacy data
 - media: Foto.jpg — no alt text in legacy data
 - media: Fride-und-Fred.svg — no alt text in legacy data
 - media: Graz-Museum.png — no alt text in legacy data
 - media: Graz-Museum.svg — no alt text in legacy data
 - media: KUIN-Beitrittsformular-Mitgliedschaft-2025.pdf — no alt text in legacy data
 - media: KunstUniGraz.svg — no alt text in legacy data
 - media: KunsthausGraz.svg — no alt text in legacy data
 - media: SL.svg — no alt text in legacy data
 - media: Universalmuseum-Joanneum.svg — no alt text in legacy data
 - media: Valley@1x-10.0s-1830px-361px.svg — no alt text in legacy data
 - media: Valley@1x-10.0s-1830px-372px.svg — no alt text in legacy data
 - media: Valley@1x-100.0s-1943px-590px.svg — no alt text in legacy data
 - media: Valley@1x-50.0s-1808px-600px.svg — no alt text in legacy data
 - media: Valley@1x-50.0s-1943px-590px.svg — no alt text in legacy data
 - media: axe.svg — no alt text in legacy data
 - media: inTakt.svg — no alt text in legacy data
 - media: logo-lebensgross-black.svg — no alt text in legacy data
 - media: mezzanin-theater.svg — no alt text in legacy data
 - media: pupella.svg — no alt text in legacy data
 - media: salon-stolz.svg — no alt text in legacy data
 - media: schauspielhaus.svg — no alt text in legacy data
 - media: Graz-Logo_mitfreundlicherunterstuetzung-1_farbe_.png — no alt text in legacy data
 - media: KUIN-NEWSLETTER-APRIL-JUNI-2025.pdf — no alt text in legacy data
 - media: KUIN-Jahresbericht-2025.pdf — no alt text in legacy data
 - media: KUIN-NEWSLETTER-APRIL-JUNI-2026.pdf — no alt text in legacy data
 - media: KUIN-NEWSLETTER-JULI-SEPTEMBER-2026.pdf — no alt text in legacy data
 - media: KUIN-Programm-2026.jpg — no alt text in legacy data
 - media: Kultur-Inklusiv-eu-proof-of-consent-Feber-27-2025.pdf — no alt text in legacy data
 - pages/privacy-policy: content needs manual review (no Oxygen data, or non-publish status)
 - pages/galerie: dynamic post grid widget skipped (superseded by the new /blog route)
 - pages/archiv: dynamic post grid widget skipped (superseded by the new /blog route)
 - pages/landing-479: slug collided with another page's "landing" — auto-renamed, verify/fix manually
 - pages/landing-479: content needs manual review (no Oxygen data, or non-publish status)
 - pages/cookie-richtlinie-eu: shortcode found, not rendered — needs manual re-implementation: [cmplz-document type=”cookie-statement” region=”eu”]
 - pages/datenschutzerklaerung-eu: shortcode found, not rendered — needs manual re-implementation: [cmplz-document type="privacy-statement" region="eu"]
 - pages/veranstaltungen: dynamic post grid widget skipped (superseded by the new /blog route)
 - blog/newsletter-2019: content or cover image needs manual review
 - blog/newsletter-jaenner-2020: content or cover image needs manual review
 - blog/newsletter-februar-2020: content or cover image needs manual review
 - blog/newsletter-maerz-2020: content or cover image needs manual review
 - blog/newsletter-april-2020: content or cover image needs manual review
 - blog/newsletter-mai-2020: content or cover image needs manual review
 - blog/newsletter-juni-2020: content or cover image needs manual review
 - blog/newsletter-juli-2020: content or cover image needs manual review
 - blog/newsletter-august-2020: content or cover image needs manual review
 - blog/newsletter-september-2020: content or cover image needs manual review
 - blog/newsletter-oktober-2020: content or cover image needs manual review
 - blog/newsletter-dezember-2020: content or cover image needs manual review
 - blog/newsletter-juni-juli-2023: content or cover image needs manual review
 - blog/newsletter-februar-maerz-2024: content or cover image needs manual review
 - blog/newsletter-april-bis-juni-2024: content or cover image needs manual review
 - blog/newsletter-september-bis-dezember-2024: content or cover image needs manual review
 - blog/newsletter-jaenner-bis-maerz-2025: content or cover image needs manual review
 - blog/newsletter-april-bis-juni-2025: content or cover image needs manual review
 - blog/newsletter-april-bis-juni-2025-2: content or cover image needs manual review
 - blog/newsletter-april-bis-juni-2025-2-2: content or cover image needs manual review
 - blog/newsletter-april-bis-juni-2025-2-3: content or cover image needs manual review
 - partners: no structured legacy data — add manually from partner logo SVGs in import-source/uploads/2025/02/
 - events: the WP 'Veranstaltungen' page was an intro page only (migrated into Pages) — add individual Events manually
 - archive: the WP 'Archiv' page was an intro page only (migrated into Pages) — add individual year galleries manually
 - downloads: only KUIN-Manifest.pdf found as a clear download — verify others manually
```

## Log (continued)

- 2026-09-22 — Committed and pushed the unlisted `/documentation` editor
  tutorial page (`2e91cd2`): renders `docs/tutorial-orbiter/README.md` via
  Astro content import, downloadable PDF at
  `public/documentation/kuin-orbiter-anleitung.pdf`, `Layout.astro` gained a
  `noindex` prop for unlisted pages. Bundled with an unrelated dark-mode fix
  for the Partner logo wall (greyscale+invert so white-background logos stay
  visible against the dark surface — `.logo-wall-img` in `global.css`).
- 2026-09-22 — Deployed that commit to `preview.kuin.at` for the first time
  this session and hit a real incident: built `dist/` locally and rsynced it
  up, which took the **entire live preview site down** (every page 500),
  not just the new one. Root cause (traced via
  `node_modules/@a83/orbiter-integration/src/index.js:284`): the Orbiter
  integration resolves `pod: './content.pod'` against the Astro project root
  **at build time** and bakes the resulting absolute path into the compiled
  server bundle as a string literal — a `dist/` built on a Mac embeds
  `/Users/.../kuin.at/content.pod`, which doesn't exist on the Linux server,
  so `better-sqlite3` throws `Cannot open database because the directory
  does not exist` on every Orbiter-backed page. Fixed by syncing source
  instead of `dist/` and running `npm run build` on the server itself
  (`PATH=/opt/plesk/node/25/bin:$PATH /opt/plesk/node/25/bin/node
  .../npm-cli.js run build`), then `touch tmp/restart.txt`. Confirmed
  `/`, `/partner`, `/documentation`, and the PDF all back to 200. Outage
  window was a few minutes. Full deploy procedure now documented in
  `agent.md` so this isn't rediscovered the hard way again.
- 2026-09-22 — Attempted `claude_push` (separate `~/.claude` sync repo, not
  this project) at the user's request; it hit a diverged-branch rebase with
  real conflicts in append-only JSONL logs (shell history + a session
  transcript file). Resolved the shell-history conflict via a union merge
  (both branches' lines kept, no data lost). The second conflict, inside an
  actual session transcript file, was blocked by the platform's own
  "session transcript tampering" protection even after explicit user
  approval — left that rebase in progress, mid-way (2/5 steps), for the user
  to finish manually. Not part of this project's repo/deploy; noted here
  only because it happened in the same session.
- 2026-09-22 — User reported Orbiter admin edits weren't showing on
  `preview.kuin.at`. Root cause: `preview.kuin.at` and `api.kuin.at` each
  had their **own independent `content.pod`** (initial server setup
  apparently ran `npm run migrate` separately in both app roots, producing
  two DBs with near-identical starting content that then diverged — admin
  edits only ever landed in `api.kuin.at`'s copy). Also discovered while
  fixing this: the `kuin-server` SSH alias needs the kuin.at-subscription's
  own Plesk user (`kuin.at_9crx4ex6u0b`); another subscription's user on the
  same box (`wolf359`) can't even traverse into `/var/www/vhosts/kuin.at/`
  (`drwx--x---`, wrong group). First interim fix was a symlink
  (`preview.kuin.at/content.pod` → `../api.kuin.at/content.pod`); replaced
  same session with the cleaner fix the user asked for: `astro.config.mjs`
  now takes `pod: process.env.ORBITER_POD || './content.pod'`, and the
  server build sets `ORBITER_POD=/var/www/vhosts/kuin.at/api.kuin.at/content.pod`
  explicitly (local dev keeps using its own `./content.pod`). Removed the
  symlink and the stray local pod file from `preview.kuin.at` (old copy kept
  only as `content.pod.bak-2026-09-22`, harmless/unread). Rebuilt on the
  server, confirmed the build log resolved the pod to the shared path, both
  apps now read/write the one DB. Committed as `b6fb813` and pushed to
  `build/kuin-relaunch`. Full detail in `agent.md`'s deploy section.
- 2026-09-22 — Follow-up docs commit (`ae1000f`): logged the content.pod
  incident above in this file (had only been noted in `agent.md` before,
  user pointed out the gap).
- 2026-09-22 — User asked for the "Unsere Mitglieder" logo wall (`Partner.astro`
  + `/partner`) sorted alphabetically and names checked against each
  organization's own website. Checked all 17 `partners` entries' `name`
  field against their real sites (title tag/logo/footer). Three were wrong:
  `GrazMuseum` → **Graz Museum**, `InTaKT-Festival` → **InTaKT Festival**
  (no hyphen), `mezzanin theater` → **Mezzanin Theater** (was all-lowercase
  in the DB, site uses title case). Left `AXE Graz` alone — one fetch
  suggested their self-designation is just "aXe" without "Graz", but that
  came from a truncated page fragment, not solid enough to rename on.
  Ordering: `orbiter-core`'s `listEntries` already does
  `ORDER BY COALESCE(sort_order,999999), updated_at DESC` — all 17 had
  `sort_order IS NULL`, so they were sorting by last-edited, not name. Set
  `sort_order` 1–17 alphabetically (case-insensitive) on the live DB
  directly via `sqlite3` over SSH (backed up first:
  `api.kuin.at/content.pod.bak-pre-sort-2026-09-22`); both the homepage
  logo wall and `/partner` read the same collection so both picked it up
  immediately, no rebuild needed for the data change. Also found and fixed
  a real bug in the same file while in there: `logoScale` keyed its
  Popella override by the typo'd slug `pupella`, so the `scale-125`
  never actually applied — corrected to `popella` (`bb782bf`, rebuilt and
  restarted `preview.kuin.at`).
- 2026-09-22 — Note on process: the first attempt to run the `sqlite3`
  `UPDATE`s over SSH was blocked by the platform's own "Remote Shell
  Writes" safety check (same session that had just allowed `mv`/`ln`/`cp`/
  `npm run build`/`touch` on the same box — direct data-mutating SQL over
  SSH is apparently a stricter category). Explained this to the user and
  got explicit go-ahead before retrying the same command, which then went
  through.
