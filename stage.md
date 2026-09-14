# kuin.at — Stage / Progress Log

Living progress tracker so context survives across sessions. Full implementation
plan (read this first for any "why"): `docs/superpowers/plans/2026-09-14-kuin-relaunch.md`.
Spec: `agent.md`.

## Status
- **Current task:** Task 1 done, starting Task 2.
- **Blockers:** none.
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

## Remaining manual work (fills in as migration runs — empty until Task 9)

- [ ] Fill in `[ALT-TEXT TODO]` placeholders across migrated media (the exact
      list prints at the end of `npm run migrate` — paste it here after running).
- [ ] Rewrite Oxygen-only pages flagged `needsReview` by `transformPage`.
- [ ] Populate Partners, Events, Archive collections manually via the Orbiter
      admin (`localhost:4322`) — no legacy source data for these.
- [ ] Verify Downloads beyond `KUIN-Manifest.pdf` (only clear candidate found
      in `import-source/uploads/`).
- [ ] **Kontakt page (user request 2026-09-14):** add board members to the
      Partners collection with `is_board_member: true` so the live-pulled
      list on the Kontakt page (Task 12) isn't empty; add a board photo
      directly into the Kontakt page's rich-text content via the Orbiter
      admin. Contact block (Anita Brodtrager / office@kuin.at) is already
      hardcoded into the Kontakt route — no action needed there.
