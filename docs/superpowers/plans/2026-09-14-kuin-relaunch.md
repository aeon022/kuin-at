# kuin.at Relaunch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Also required:** keep `stage.md` (repo root) updated after every task — one line appended to its "Log" section stating what just landed and any open follow-up. This is the user's own progress ledger and is separate from this plan's checkboxes.

**Goal:** Rebuild kuin.at (Kultur Inklusiv Graz) as an Astro + Tailwind v4 + Orbiter site, migrating content and media from the legacy WordPress/Oxygen export in `import-source/`, with a first-class "Leicht Lesen" (easy-read) toggle and WCAG 2.1 AAA accessibility.

**Architecture:** Astro (SSR, since content is fetched live from Orbiter at request time) + Tailwind v4 CSS-based theme + Zod schemas as the single source of truth for content shape, mirrored as Orbiter collection schemas. A one-shot Node/TS migration script reads the legacy MySQL dump and `uploads/` folder directly (no MySQL server needed — the dump's `posts`/`postmeta`/`options` tables are parsed with a small tuple-aware regex reader) and writes into a fresh Orbiter `.pod` file via `@a83/orbiter-core`. A global Nano Store holds the "Leicht Lesen" boolean; Astro routes read it (client-side persisted, server reads the cookie/query fallback — see Task 12) and pick `content_leicht_lesen` vs `content_standard`.

**Tech Stack:** Astro 5 (output: `server`), Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`), TypeScript, Zod, Nano Stores, `@a83/orbiter-core` 0.3.14, `@a83/orbiter-integration` 0.3.18, `@a83/orbiter-admin` 0.3.81, `tsx` (dev-only, to run `.ts` scripts and tests), Node's built-in `node:test` runner (no Jest/Vitest — stdlib covers pure-function tests here).

**Spec:** `/Users/gweiher/Sites/kuin.at/agent.md` (project brief, schema list, accessibility mandate). Grounding research for this plan (do not re-derive, trust these): `/Users/gweiher/Developing/Projects/orbiter/AI_SETUP.md` (real Orbiter API shape), `/Users/gweiher/Developing/Projects/orbiter/ORBITER_CONTEXT.md` (field types, DB methods, admin routes), `/Users/gweiher/Developing/Projects/orbiter/packages/admin/src/wp-importer.js` (existing WP→Orbiter import conventions), `import-source/wp_9bhnv_2026-09-14_13-30-44.sql` (legacy data), `import-source/uploads/` (legacy media).

## Global Constraints

- Astro output mode must be `'server'` (Orbiter's `orbiter:collections` virtual module needs live reads per the "Live-Daten Integration" requirement in agent.md — confirmed as mandatory in ORBITER_CONTEXT.md §10.1).
- No custom UI component libraries; use native HTML elements styled with Tailwind v4 utilities (agent.md "Entwicklungsrichtlinien").
- Every interactive element keyboard-operable with visible `focus-visible:ring` — prefer native elements (`<button>`, `<a>`, `<details>`) that get this for free over custom widgets with manual ARIA.
- Every image requires an `alt` attribute. Where the source data has no alt text, store and render an explicit, visibly-flagged placeholder (never silently omit `alt` or submit an empty string that reads as decorative).
- Text/background colour pairs used for body copy must hit WCAG AAA contrast (≥7:1 normal text, ≥4.5:1 large text ≥24px/19px-bold) — enforced by an automated contrast check (Task 2), not eyeballing.
- `content_leicht_lesen` is optional per agent.md; when absent, always fall back to `content_standard` — never render empty content.
- Orbiter's entry `slug` (the second argument to `createEntry`/`db.createEntry`) is the canonical slug — do not also declare a duplicate `slug` field inside the collection schema's `data` JSON, even though agent.md's schema tables list `slug` as a field. This is a real mapping correction, not a simplification — flagged once here so every task downstream uses the entry-identity slug consistently.
- Orbiter has no native "array of objects" (repeater) field type (confirmed field-type list: string, richtext, number, boolean, date, datetime, select, array, image, media, url, email, relation, weekdays). Archive's `images: Array<{image_url, alt_text, caption}>` is stored as a JSON array in an `array`-typed field; the Orbiter admin UI will edit it as raw JSON (acceptable, documented limitation — not a gap to build a custom repeater widget for).
- Legacy data reality check (read from the dump, not assumed): 13 WP pages, 25 WP posts, 207 attachments, only 14 of those attachments have an existing `_wp_attachment_image_alt` value.
- **Every real WP page's `post_content` is empty.** All 12 published pages (`kuin`, `landing`, `der-verein`, `kontakt`, `social-proof`, `galerie`, `archiv`, `impressum`, `cookie-richtlinie-eu`, `datenschutzerklaerung-eu`, `veranstaltungen`, plus the draft `landing` #479 which has no builder data at all and is skipped) store their actual content in the Oxygen page-builder's `_ct_builder_json` postmeta value — a structured component tree, not HTML. This is **fully parseable** (verified against every component type used site-wide — 21 distinct types) and the migration extracts real content from it; it does not fall back to a placeholder for these 12 pages. Task 6 builds the extractor.
- The 25 WP blog posts (`post_type = 'post'`) do **not** use Oxygen — they're plain Gutenberg `post_content` (confirmed: no post id of type `post` has a `_ct_builder_json` row). The original simpler `stripToText` approach in Task 7 (transform) is correct for these as-is.
- Three genuine extraction gaps exist and are flagged, never silently dropped: (1) `ct_shortcode` nodes (e.g. the Kontakt page embeds a contact-form shortcode, the cookie-policy pages embed a Complianz shortcode) — their raw shortcode text is preserved as an HTML comment plus a review note, since a shortcode can't be statically rendered; (2) `oxy_posts_grid` nodes (a dynamic blog-listing widget on one page) are dropped with an informational note, since the new `/blog` route already replaces that functionality; (3) any component type not in the surveyed vocabulary gets its text forwarded (never discarded) wrapped in a paragraph, flagged for manual verification.

---

## File Structure

```
kuin.at/
├── stage.md                              # living progress ledger (Task 1, updated every task)
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── content.pod                           # Orbiter pod (gitignored; created by scripts)
├── scripts/
│   ├── setup-collections.ts              # Task 4 — creates the 6 Orbiter collections
│   └── migrate/
│       ├── run.ts                        # Task 9 — orchestrates the one-shot migration
│       └── lib/
│           ├── parseWpSql.ts             # Task 5 — tuple-aware mysqldump reader
│           ├── parseWpSql.test.ts
│           ├── parseOxygenTree.ts        # Task 6 — Oxygen builder-JSON → semantic HTML
│           ├── parseOxygenTree.test.ts
│           ├── transformContent.ts       # Task 7 — WP row → collection entry mapper
│           ├── transformContent.test.ts
│           ├── migrateMedia.ts           # Task 8 — uploads/ → Orbiter media
│           └── migrateMedia.test.ts
├── src/
│   ├── schemas/                          # Task 3
│   │   ├── page.ts
│   │   ├── event.ts
│   │   ├── blogPost.ts
│   │   ├── archive.ts
│   │   ├── partner.ts
│   │   ├── download.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── contrast.ts                   # Task 2
│   │   ├── contrast.test.ts
│   │   ├── content.ts                    # Task 12 — getDisplayContent()
│   │   └── content.test.ts
│   ├── stores/
│   │   ├── leichtLesenStore.ts            # Task 10
│   │   └── leichtLesenStore.test.ts
│   ├── styles/
│   │   └── global.css                    # Task 1 + Task 2 (@theme tokens)
│   ├── layouts/
│   │   └── BaseLayout.astro              # Task 1
│   ├── components/
│   │   ├── Header.astro                  # Task 11
│   │   └── LeichtLesenToggle.astro        # Task 11
│   └── pages/
│       ├── index.astro                   # Task 12
│       ├── [slug].astro                  # Task 12 — Pages collection
│       ├── blog/
│       │   ├── index.astro               # Task 12
│       │   └── [slug].astro              # Task 12
│       ├── events/
│       │   ├── index.astro               # Task 12
│       │   └── [slug].astro              # Task 12
│       ├── archiv/
│       │   └── index.astro               # Task 13
│       ├── partner/
│       │   └── index.astro               # Task 13
│       └── downloads/
│           └── index.astro               # Task 13
└── import-source/                        # already present, read-only
```

---

### Task 1: Project scaffold — Astro + Tailwind v4 + TypeScript + Zod + stage.md

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `.gitignore`, `stage.md`

**Interfaces:**
- Produces: a buildable Astro project (`npm run build` exits 0) that every later task adds files into. `BaseLayout.astro` exposes `Astro.props: { title: string; description?: string }` and renders `<slot />` inside `<main>`.

- [ ] **Step 1: Scaffold Astro**

```bash
npm create astro@latest . -- --template minimal --install --no-git --yes --typescript strict
```

- [ ] **Step 2: Add Tailwind v4, Zod, Nano Stores, Orbiter packages, tsx**

```bash
npm install @tailwindcss/vite tailwindcss zod nanostores @nanostores/persistent \
  @a83/orbiter-core@0.3.14 @a83/orbiter-integration@0.3.18 @a83/orbiter-admin@0.3.81
npm install --save-dev tsx
```

`@nanostores/persistent` is a 1KB official Nano Stores addon for `localStorage`-synced atoms — it's the native "already in the ecosystem we just chose" option for Task 10, so pull it in now rather than hand-rolling `localStorage` glue.

- [ ] **Step 3: Configure `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import orbiter from '@a83/orbiter-integration';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { plugins: [tailwindcss()] },
  integrations: [orbiter({ pod: './content.pod' })],
});
```

Run `npm install @astrojs/node` alongside the packages above — it's the deploy target for `output: 'server'`; without an adapter `astro build` fails immediately, so it belongs in this task, not deferred.

- [ ] **Step 4: `src/styles/global.css` — Tailwind v4 entry point (tokens land in Task 2)**

```css
@import "tailwindcss";
```

- [ ] **Step 5: `src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
interface Props { title: string; description?: string }
const { title, description = 'Kultur Inklusiv Graz — Kunst und Kultur barrierefrei erleben.' } = Astro.props;
---
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} · KUIN</title>
  <meta name="description" content={description} />
</head>
<body class="bg-bg text-ink">
  <slot />
</body>
</html>
```

- [ ] **Step 6: Placeholder `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Home">
  <main>
    <h1 class="text-3xl font-bold">KUIN — Kultur Inklusiv</h1>
  </main>
</BaseLayout>
```

- [ ] **Step 7: `.gitignore`**

```
node_modules/
dist/
.astro/
content.pod
*.pod
import-source/
```

`import-source/` (133MB of legacy WP export data) is a one-time migration
input, not part of the shipped site — it stays on disk for the migration
scripts to read but never enters git history.

- [ ] **Step 8: Verify the build**

Run: `npm run build`
Expected: exits 0, no Tailwind/Astro errors.

- [ ] **Step 9: Update `stage.md`**

`stage.md` already exists at the repo root with real planning notes (brand
colors, the Oxygen-extraction finding, Orbiter package versions) — do not
overwrite it. Just append a line to its `## Log` section and update
`## Status`:

```markdown
## Status
- Current task: Task 1 done, starting Task 2.
- Blockers: none.
```
```markdown
## Log
- 2026-09-14 — Task 1: Astro + Tailwind v4 + Zod + Nano Stores + Orbiter scaffolded. `npm run build` green.
```

- [ ] **Step 10: Commit**

The repo was already initialized and switched to branch `build/kuin-relaunch`
as part of session setup (no prior commits existed, so there was no `main`
to protect) — just add and commit:

```bash
git add -A
git commit -m "chore: scaffold Astro + Tailwind v4 + Orbiter project"
```

---

### Task 2: Brand colour tokens + AAA contrast check

**Files:**
- Create: `src/lib/contrast.ts`, `src/lib/contrast.test.ts`
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `relativeLuminance(hex: string): number`, `contrastRatio(hexA: string, hexB: string): number` — pure functions used by the test in this task and available to any future design-audit tooling. Also produces the Tailwind `@theme` tokens (`--color-rose-*`, `--color-teal-*`, `--color-slate-*`, `--color-ink`, `--color-bg`) every later UI task styles against.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/contrast.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relativeLuminance, contrastRatio } from './contrast.ts';

test('relativeLuminance of pure white is 1, pure black is 0', () => {
  assert.ok(Math.abs(relativeLuminance('#ffffff') - 1) < 0.0001);
  assert.ok(Math.abs(relativeLuminance('#000000') - 0) < 0.0001);
});

test('contrastRatio of black on white is 21:1', () => {
  assert.ok(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.01);
});

test('brand body-text pairs meet WCAG AAA (>=7:1) for normal text', () => {
  // ink on bg — primary reading pair used by BaseLayout
  assert.ok(contrastRatio('#2b2420', '#fdfcfb') >= 7, 'ink on bg must be >= 7:1');
  // rose-700 (text-safe shade) on bg
  assert.ok(contrastRatio('#7a2f42', '#fdfcfb') >= 7, 'rose-700 on bg must be >= 7:1');
  // slate-700 (text-safe shade) on bg
  assert.ok(contrastRatio('#32415a', '#fdfcfb') >= 7, 'slate-700 on bg must be >= 7:1');
});

test('contrastRatio is symmetric', () => {
  assert.equal(contrastRatio('#111111', '#eeeeee'), contrastRatio('#eeeeee', '#111111'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/contrast.test.ts`
Expected: FAIL — `Cannot find module './contrast.ts'`

- [ ] **Step 3: Implement `src/lib/contrast.ts`**

```typescript
// WCAG 2.1 relative luminance + contrast ratio. Pure, no deps — the formula
// is ~15 lines of arithmetic, not worth a library.
function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const [rl, gl, bl] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/contrast.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Write the Tailwind v4 theme tokens**

The legacy site's real accent colours (read directly from the WP dump's nav-menu
customizer settings and Automatic.css tokens, not guessed): rose `#cc5972`,
teal `#65bec2`, slate `#566d8f`, near-black ink `#2f201a`. These are kept as
the *brand* shades (logos, accent fills, illustrations) but are **too light**
for AAA body text on a light background, so each gets a darkened `-700`
text-safe twin, verified by the test above.

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-bg: #fdfcfb;
  --color-ink: #2b2420;

  --color-rose-500: #cc5972;
  --color-rose-700: #7a2f42;

  --color-teal-500: #65bec2;
  --color-teal-700: #1f5a5c;

  --color-slate-500: #566d8f;
  --color-slate-700: #32415a;

  --font-sans: "system-ui", "Segoe UI", sans-serif;
  --radius-md: 0.5rem;
}

:focus-visible {
  outline: 3px solid var(--color-teal-700);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Update `stage.md` log, commit**

```bash
git add -A
git commit -m "feat: AAA-checked brand colour tokens from legacy WP dump"
```

---

### Task 3: Zod schemas for the 6 Orbiter collections

**Files:**
- Create: `src/schemas/page.ts`, `src/schemas/event.ts`, `src/schemas/blogPost.ts`, `src/schemas/archive.ts`, `src/schemas/partner.ts`, `src/schemas/download.ts`, `src/schemas/index.ts`, `src/schemas/schemas.test.ts`

**Interfaces:**
- Produces: `PageSchema`, `EventSchema`, `BlogPostSchema`, `ArchiveSchema`, `PartnerSchema`, `DownloadSchema` (all `z.object` instances) plus inferred types `Page`, `Event`, `BlogPost`, `Archive`, `Partner`, `Download`, re-exported from `src/schemas/index.ts`. Every later task that reads an Orbiter entry (`src/lib/content.ts`, all route files, the migration scripts) parses through these.

- [ ] **Step 1: Write the failing test**

```typescript
// src/schemas/schemas.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PageSchema, EventSchema, BlogPostSchema, ArchiveSchema, PartnerSchema, DownloadSchema } from './index.ts';

test('PageSchema accepts a minimal valid page', () => {
  const result = PageSchema.safeParse({
    title: 'Über uns', content_standard: '<p>Hallo</p>', seo_description: 'Über KUIN.',
  });
  assert.ok(result.success);
});

test('BlogPostSchema rejects an empty cover_image', () => {
  const result = BlogPostSchema.safeParse({
    title: 'News', published_at: '2026-01-01T00:00:00Z',
    cover_image: '', content_standard: '<p>x</p>',
  });
  assert.equal(result.success, false);
});

test('BlogPostSchema accepts cover_image as an Orbiter media-id string', () => {
  const result = BlogPostSchema.safeParse({
    title: 'News', published_at: '2026-01-01T00:00:00Z',
    cover_image: 'a1b2c3d4-media-id', content_standard: '<p>x</p>',
  });
  assert.ok(result.success);
});

test('EventSchema accepts accessibility_features array and optional LL field', () => {
  const result = EventSchema.safeParse({
    title: 'Stadtspaziergang', start_date: '2026-05-01T10:00:00Z', end_date: '2026-05-01T12:00:00Z',
    location: 'Hauptplatz Graz', description_standard: '<p>x</p>',
    accessibility_features: ['Gebärdensprache', 'Rollstuhlgerecht'],
  });
  assert.ok(result.success);
});

test('ArchiveSchema requires alt_text on every image', () => {
  const result = ArchiveSchema.safeParse({
    title: 'Walk 2025', year: 2025, description: 'Rückblick',
    images: [{ image_url: '/a.jpg', caption: 'Gruppenfoto' }],
  });
  assert.equal(result.success, false);
});

test('PartnerSchema accepts logo as an Orbiter media-id string, defaults is_board_member to false', () => {
  const result = PartnerSchema.safeParse({
    name: 'Universalmuseum Joanneum', logo: 'e5f6-media-id',
    website_url: 'https://www.museum-joanneum.at', description: 'Partner',
  });
  assert.ok(result.success);
  assert.equal(result.data.is_board_member, false);
});

test('DownloadSchema validates a file entry as an Orbiter media-id string', () => {
  const result = DownloadSchema.safeParse({
    title: 'KUIN Manifest', file: 'f7a8-media-id', description: 'Unser Manifest',
  });
  assert.ok(result.success);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/schemas/schemas.test.ts`
Expected: FAIL — `Cannot find module './index.ts'`

- [ ] **Step 3: Implement the schemas**

```typescript
// src/schemas/page.ts
import { z } from 'zod';

export const PageSchema = z.object({
  title: z.string().min(1),
  content_standard: z.string().min(1),
  content_leicht_lesen: z.string().optional(),
  seo_description: z.string().max(320).optional(),
});
export type Page = z.infer<typeof PageSchema>;
```

```typescript
// src/schemas/event.ts
import { z } from 'zod';

export const EventSchema = z.object({
  title: z.string().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  location: z.string().min(1),
  description_standard: z.string().min(1),
  description_leicht_lesen: z.string().optional(),
  accessibility_features: z.array(z.string()).default([]),
  gallery_id: z.string().optional(),
});
export type Event = z.infer<typeof EventSchema>;
```

```typescript
// src/schemas/blogPost.ts
import { z } from 'zod';

// cover_image is a plain Orbiter media-id string (the entry stores a
// reference; Orbiter's own `image` field type works this way — see
// setup-collections.ts). The required alt text lives on the `_media` row
// itself, enforced when the media is uploaded (Task 8), not duplicated
// here. Resolve it at render time via `getMediaItem` from 'orbiter:media'.
export const BlogPostSchema = z.object({
  title: z.string().min(1),
  published_at: z.string().datetime(),
  cover_image: z.string().min(1),
  content_standard: z.string().min(1),
  content_leicht_lesen: z.string().optional(),
});
export type BlogPost = z.infer<typeof BlogPostSchema>;
```

```typescript
// src/schemas/archive.ts
import { z } from 'zod';

const ArchiveImage = z.object({
  image_url: z.string().min(1),
  alt_text: z.string().min(1, 'alt_text is required for every image'),
  caption: z.string().optional(),
});

export const ArchiveSchema = z.object({
  title: z.string().min(1),
  year: z.number().int(),
  description: z.string().optional(),
  images: z.array(ArchiveImage).default([]),
});
export type Archive = z.infer<typeof ArchiveSchema>;
```

```typescript
// src/schemas/partner.ts
import { z } from 'zod';

// logo is a plain Orbiter media-id string — same reasoning as
// BlogPostSchema.cover_image above.
export const PartnerSchema = z.object({
  name: z.string().min(1),
  logo: z.string().min(1),
  website_url: z.string().url().optional(),
  description: z.string().optional(),
  is_board_member: z.boolean().default(false),
});
export type Partner = z.infer<typeof PartnerSchema>;
```

```typescript
// src/schemas/download.ts
import { z } from 'zod';

// file is a plain Orbiter media-id string — Orbiter's media-serve route
// (/orbiter/media/:id) already sends the correct filename via
// Content-Disposition, so no separate filename field is needed here.
export const DownloadSchema = z.object({
  title: z.string().min(1),
  file: z.string().min(1),
  description: z.string().optional(),
});
export type Download = z.infer<typeof DownloadSchema>;
```

```typescript
// src/schemas/index.ts
export * from './page.ts';
export * from './event.ts';
export * from './blogPost.ts';
export * from './archive.ts';
export * from './partner.ts';
export * from './download.ts';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/schemas/schemas.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Zod schemas for all 6 Orbiter collections"
```

---

### Task 4: Orbiter collection bootstrap script

**Files:**
- Create: `scripts/setup-collections.ts`, `scripts/setup-collections.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks besides `@a83/orbiter-core`'s `createPod`.
- Produces: `createKuinCollections(podPath: string): void`, called by `scripts/migrate/run.ts` in Task 9. Collection ids fixed as `pages`, `events`, `blog`, `archive`, `partners`, `downloads` — every later task (migration, routes) uses these exact ids.

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test scripts/setup-collections.test.ts`
Expected: FAIL — `Cannot find module './setup-collections.ts'`

- [ ] **Step 3: Implement `scripts/setup-collections.ts`**

```typescript
import { createPod } from '@a83/orbiter-core';

export function createKuinCollections(podPath: string): void {
  const db = createPod(podPath, {
    site: { name: 'Kultur Inklusiv Graz', description: 'Kunst und Kultur barrierefrei erleben.', locale: 'de' },
  });

  db.createCollection('pages', 'Seiten', {
    title: { type: 'string', label: 'Titel', required: true },
    content_standard: { type: 'richtext', label: 'Inhalt (Standard)', required: true },
    content_leicht_lesen: { type: 'richtext', label: 'Inhalt (Leicht Lesen)' },
    seo_description: { type: 'string', label: 'SEO-Beschreibung' },
  });

  db.createCollection('events', 'Veranstaltungen', {
    title: { type: 'string', label: 'Titel', required: true },
    start_date: { type: 'datetime', label: 'Start', required: true },
    end_date: { type: 'datetime', label: 'Ende', required: true },
    location: { type: 'string', label: 'Ort / Treffpunkt', required: true },
    description_standard: { type: 'richtext', label: 'Beschreibung (Standard)', required: true },
    description_leicht_lesen: { type: 'richtext', label: 'Beschreibung (Leicht Lesen)' },
    accessibility_features: { type: 'array', label: 'Barrierefreiheits-Merkmale' },
    gallery_id: { type: 'relation', label: 'Galerie', relationTo: 'archive' },
  });

  db.createCollection('blog', 'Blog', {
    title: { type: 'string', label: 'Titel', required: true },
    published_at: { type: 'datetime', label: 'Veröffentlicht', required: true },
    cover_image: { type: 'image', label: 'Titelbild', required: true },
    content_standard: { type: 'richtext', label: 'Inhalt (Standard)', required: true },
    content_leicht_lesen: { type: 'richtext', label: 'Inhalt (Leicht Lesen)' },
  });

  db.createCollection('archive', 'Archiv / Rückblicke', {
    title: { type: 'string', label: 'Titel', required: true },
    year: { type: 'number', label: 'Jahr', required: true },
    description: { type: 'string', label: 'Beschreibung' },
    images: { type: 'array', label: 'Bilder (JSON: image_url, alt_text, caption)' },
  });

  db.createCollection('partners', 'Partner & Mitglieder', {
    name: { type: 'string', label: 'Name', required: true },
    logo: { type: 'image', label: 'Logo', required: true },
    website_url: { type: 'url', label: 'Website' },
    description: { type: 'string', label: 'Beschreibung' },
    is_board_member: { type: 'boolean', label: 'Vorstandsmitglied' },
  });

  db.createCollection('downloads', 'Downloads', {
    title: { type: 'string', label: 'Titel', required: true },
    file: { type: 'media', label: 'Datei', required: true },
    description: { type: 'string', label: 'Beschreibung' },
  });

  db.close();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test scripts/setup-collections.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Orbiter collection bootstrap script for all 6 kuin.at schemas"
```

---

### Task 5: WP SQL dump reader

**Files:**
- Create: `scripts/migrate/lib/parseWpSql.ts`, `scripts/migrate/lib/parseWpSql.test.ts`

**Interfaces:**
- Produces: `parseInsertTuples(sql: string, tableSuffix: string): string[][]` (raw string cells per row), `parsePosts(sql: string): WpPost[]`, `parsePostmeta(sql: string): Map<string, Array<{key: string; value: string}>>`, and the `WpPost` type (`{ id, postType, postStatus, postTitle, postContent, postExcerpt, postName, postDate, postParent, postMimeType, guid }`). Consumed by Task 7 (`transformContent.ts`) and Task 8 (`migrateMedia.ts`).

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/migrate/lib/parseWpSql.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseInsertTuples, parsePosts, parsePostmeta } from './parseWpSql.ts';

const FIXTURE_POSTS = `
INSERT INTO \`wp_posts\` VALUES
(1,1,'2024-05-14 08:28:36','2024-05-14 08:28:36','<p>Hello, it\\'s us</p>','Kontakt','','publish','closed','closed','','kontakt','','','2024-05-14 08:28:36','2024-05-14 08:28:36','',0,'https://kuin.at/?p=1',0,'page','',0),
(2,1,'2024-05-14 09:00:00','2024-05-14 09:00:00','','Logo','','inherit','open','closed','','logo','','','2024-05-14 09:00:00','2024-05-14 09:00:00','',0,'https://kuin.at/wp-content/uploads/2024/05/Logo.svg',0,'attachment','image/svg+xml',0);
`;

const FIXTURE_POSTMETA = `
INSERT INTO \`wp_postmeta\` VALUES
(1,2,'_wp_attachment_image_alt','Das KUIN Logo'),
(2,2,'_wp_attachment_metadata','a:1:{s:5:\\"width\\";i:100;}');
`;

test('parseInsertTuples splits top-level tuples, respecting escaped quotes', () => {
  const rows = parseInsertTuples(FIXTURE_POSTS, 'posts');
  assert.equal(rows.length, 2);
  assert.equal(rows[0][5], "Hello, it's us"); // post_content, unescaped
  assert.equal(rows[0][6], 'Kontakt'); // post_title
});

test('parsePosts maps tuples to typed WpPost rows', () => {
  const posts = parsePosts(FIXTURE_POSTS);
  assert.equal(posts.length, 2);
  assert.equal(posts[0].postType, 'page');
  assert.equal(posts[0].postName, 'kontakt');
  assert.equal(posts[1].postType, 'attachment');
  assert.equal(posts[1].postMimeType, 'image/svg+xml');
});

test('parsePostmeta groups meta rows by post id', () => {
  const meta = parsePostmeta(FIXTURE_POSTMETA);
  const metaForPost2 = meta.get('2') ?? [];
  const alt = metaForPost2.find((m) => m.key === '_wp_attachment_image_alt');
  assert.equal(alt?.value, 'Das KUIN Logo');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test scripts/migrate/lib/parseWpSql.test.ts`
Expected: FAIL — `Cannot find module './parseWpSql.ts'`

- [ ] **Step 3: Implement `scripts/migrate/lib/parseWpSql.ts`**

```typescript
// ponytail: regex/char-scan tuple splitter tuned to mysqldump's single-quote,
// backslash-escaped output. It is not a general SQL parser — if import-source
// ever ships a dump in a different quoting style (e.g. from pg_dump), this
// needs a real parser instead of a wider regex.

export interface WpPost {
  id: string;
  postAuthor: string;
  postDate: string;
  postContent: string;
  postTitle: string;
  postExcerpt: string;
  postStatus: string;
  postName: string;
  postParent: string;
  guid: string;
  postType: string;
  postMimeType: string;
}

function splitTopLevelTuples(valuesBlock: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < valuesBlock.length; i++) {
    const ch = valuesBlock[i];
    const prev = valuesBlock[i - 1];
    if (inString) {
      if (ch === "'" && prev !== '\\') inString = false;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === '(') { if (depth === 0) start = i; depth++; continue; }
    if (ch === ')') {
      depth--;
      if (depth === 0 && start >= 0) { tuples.push(valuesBlock.slice(start + 1, i)); start = -1; }
    }
  }
  return tuples;
}

function splitCells(tuple: string): string[] {
  const cells: string[] = [];
  let inString = false;
  let cur = '';
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (inString) {
      if (ch === '\\' && tuple[i + 1] !== undefined) { cur += unescapeOne(tuple[i + 1]); i++; continue; }
      if (ch === "'") { inString = false; continue; }
      cur += ch;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === ',') { cells.push(cur.trim() === 'NULL' ? '' : cur); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim() === 'NULL' ? '' : cur);
  return cells;
}

function unescapeOne(ch: string): string {
  if (ch === 'n') return '\n';
  if (ch === 'r') return '\r';
  if (ch === 't') return '\t';
  return ch; // covers \\' \\\\ \\" etc.
}

export function parseInsertTuples(sql: string, tableSuffix: string): string[][] {
  const re = new RegExp(`INSERT INTO \`[a-zA-Z0-9_]*${tableSuffix}\` VALUES\\n([\\s\\S]*?);\\n`, 'g');
  const tuples: string[][] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(sql)) !== null) {
    for (const t of splitTopLevelTuples(match[1])) tuples.push(splitCells(t));
  }
  return tuples;
}

export function parsePosts(sql: string): WpPost[] {
  return parseInsertTuples(sql, 'posts').map((c) => ({
    id: c[0], postAuthor: c[1], postDate: c[2], postContent: c[4], postTitle: c[5],
    postExcerpt: c[6], postStatus: c[7], postName: c[11], postParent: c[17],
    guid: c[18], postType: c[20], postMimeType: c[21],
  }));
}

export function parsePostmeta(sql: string): Map<string, Array<{ key: string; value: string }>> {
  const byPost = new Map<string, Array<{ key: string; value: string }>>();
  for (const c of parseInsertTuples(sql, 'postmeta')) {
    const postId = c[1];
    const entry = { key: c[2], value: c[3] };
    if (!byPost.has(postId)) byPost.set(postId, []);
    byPost.get(postId)!.push(entry);
  }
  return byPost;
}
```

Note: `parseInsertTuples` column indices above match the *fixture's* column
count (22 columns, mirroring the real `posts` table minus nothing — verify
against the real dump header in Task 7/9, where the actual table has the
same 22-column layout confirmed by reading the dump's `CREATE TABLE` during
planning: `ID, post_author, post_date, post_date_gmt, post_content, post_title,
post_excerpt, post_status, comment_status, ping_status, post_password,
post_name, to_ping, pinged, post_modified, post_modified_gmt,
post_content_filtered, post_parent, guid, menu_order, post_type,
post_mime_type, comment_count`). `postmeta` is `(meta_id, post_id, meta_key,
meta_value)`. `_ct_builder_json` is one of `postmeta`'s `meta_value`s — Task 6
parses that value's *content* (a separate JSON tree), not more mysqldump
tuples, so it doesn't depend on this file beyond consuming `parsePostmeta`'s
output map.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test scripts/migrate/lib/parseWpSql.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Sanity-check against the real dump (not a unit test — a one-off manual check)**

Run:
```bash
node --import tsx -e "
import { readFileSync } from 'node:fs';
import { parsePosts } from './scripts/migrate/lib/parseWpSql.ts';
const sql = readFileSync('import-source/wp_9bhnv_2026-09-14_13-30-44.sql', 'utf-8');
const posts = parsePosts(sql);
console.log('total rows:', posts.length);
console.log('pages:', posts.filter(p => p.postType === 'page' && p.postStatus === 'publish').map(p => p.postTitle));
"
```
Expected: `total rows` equal to 348 and the publish-status pages list includes `KUIN`, `Landing`, `Über uns`, `Kontakt`, `Social Proof`, `Galerie`, `Archiv`, `Impressum`, `Cookie-Richtlinie (EU)`, `Datenschutzerklärung (EU)`, `Veranstaltungen` (11 pages — there is no page literally titled "Home"; `Landing` is the actual home page, corrected here after Task 5's real-data check caught this inaccuracy in the original text).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: tuple-aware mysqldump reader for WP posts/postmeta"
```

---

### Task 6: Oxygen builder-JSON → semantic HTML extractor

This is the task that gets real content out of Oxygen instead of a placeholder.
Every one of the 12 real WP pages stores its actual body in the `_ct_builder_json`
postmeta value — a structured component tree (verified during planning, not
assumed: `{"id":0,"name":"root","children":[{"name":"ct_headline","options":
{"ct_content":"...","original":{"tag":"h1"}}}, ...]}`). This task walks that
tree and serializes it to clean semantic HTML — headings, paragraphs, links,
images — discarding Oxygen's layout wrapper divs/sections entirely (no div
soup, per Global Constraints). It never discards text: every node with
`ct_content` gets rendered as real content; the three genuine gaps (raw
shortcodes, the dynamic posts-grid widget, and any not-yet-seen component
type) are forwarded into a `notes` array instead of disappearing.

**Files:**
- Create: `scripts/migrate/lib/parseOxygenTree.ts`, `scripts/migrate/lib/parseOxygenTree.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks — takes the raw `_ct_builder_json` string value directly (Task 9's orchestrator is what fetches that value from `parsePostmeta`'s map and passes it in) plus a caller-supplied `resolveImageAlt` callback.
- Produces: `extractOxygenContent(builderJsonText: string, resolveImageAlt: (src: string) => string | null): { html: string; notes: string[] }`. Consumed by Task 7's `transformPage`.

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/migrate/lib/parseOxygenTree.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractOxygenContent } from './parseOxygenTree.ts';

function tree(children: unknown[]): string {
  return JSON.stringify({ id: 0, name: 'root', depth: 0, children });
}

test('extracts a headline using its tag option, decoding HTML entities', () => {
  const json = tree([
    { id: 1, name: 'ct_headline', options: { ct_content: 'Anfragen &amp; Information', original: { tag: 'h1' } } },
  ]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Anfragen & Information</h1>');
  assert.deepEqual(notes, []);
});

test('defaults headline tag to h2 when original.tag is missing or invalid', () => {
  const json = tree([{ id: 1, name: 'ct_headline', options: { ct_content: 'Titel', original: [] } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h2>Titel</h2>');
});

test('wraps text_block content in its tag option, default p', () => {
  const json = tree([{ id: 1, name: 'ct_text_block', options: { ct_content: 'Hallo Welt', original: { tag: 'p' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<p>Hallo Welt</p>');
});

test('resolves image alt text via the provided resolver, keyed by src filename', () => {
  const json = tree([{ id: 1, name: 'ct_image', options: { original: { src: 'https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg' } } }]);
  const { html } = extractOxygenContent(json, (src) => (src.includes('KUIN-Logo') ? 'Das KUIN Logo' : null));
  assert.equal(html, '<img src="https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg" alt="Das KUIN Logo" />');
});

test('falls back to a visible placeholder alt when the resolver returns null', () => {
  const json = tree([{ id: 1, name: 'ct_image', options: { original: { src: 'https://kuin.at/x.jpg' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.match(html, /alt="\[ALT-TEXT TODO/);
});

test('renders a link_button as an anchor with its url and label', () => {
  const json = tree([{ id: 1, name: 'ct_link_button', options: { ct_content: 'Über uns', original: { url: 'https://kuin.at/der-verein/', target: '' } } }]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<a href="https://kuin.at/der-verein/">Über uns</a>');
});

test('container nodes (div/section) emit no wrapper tag of their own, just their children', () => {
  const json = tree([
    { id: 1, name: 'ct_div_block', options: {}, children: [
      { id: 2, name: 'ct_section', options: {}, children: [
        { id: 3, name: 'ct_headline', options: { ct_content: 'Netzwerk', original: { tag: 'h1' } } },
      ] },
    ] },
  ]);
  const { html } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Netzwerk</h1>');
});

test('skips header/nav/decorative nodes silently (no note, no output) since they are not page content', () => {
  const json = tree([
    { id: 1, name: 'oxy_header', options: {}, children: [{ id: 2, name: 'ct_fancy_icon', options: {} }] },
    { id: 3, name: 'ct_headline', options: { ct_content: 'Echter Inhalt', original: { tag: 'h1' } } },
  ]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<h1>Echter Inhalt</h1>');
  assert.deepEqual(notes, []);
});

test('preserves an unrenderable shortcode as an HTML comment and flags it in notes', () => {
  const json = tree([{ id: 1, name: 'ct_shortcode', options: { original: { full_shortcode: '[fluentform id=3]' } } }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.match(html, /SHORTCODE TODO.*\[fluentform id=3\]/);
  assert.equal(notes.length, 1);
});

test('drops a dynamic posts-grid widget with an informational note', () => {
  const json = tree([{ id: 1, name: 'oxy_posts_grid', options: {} }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '');
  assert.match(notes[0], /dynamic post grid/);
});

test('forwards text from an unknown component type as a paragraph, flagged for review', () => {
  const json = tree([{ id: 1, name: 'ct_some_future_widget', options: { ct_content: 'Neuer Inhalt' } }]);
  const { html, notes } = extractOxygenContent(json, () => null);
  assert.equal(html, '<p>Neuer Inhalt</p>');
  assert.match(notes[0], /unknown component type/);
});

test('returns empty html and a note on invalid JSON instead of throwing', () => {
  const { html, notes } = extractOxygenContent('{not valid json', () => null);
  assert.equal(html, '');
  assert.equal(notes.length, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test scripts/migrate/lib/parseOxygenTree.test.ts`
Expected: FAIL — `Cannot find module './parseOxygenTree.ts'`

- [ ] **Step 3: Implement `scripts/migrate/lib/parseOxygenTree.ts`**

```typescript
export interface OxygenExtractResult { html: string; notes: string[] }

interface OxygenNode {
  name?: string;
  options?: {
    ct_content?: string;
    original?: Record<string, unknown> | unknown[];
  };
  children?: OxygenNode[];
}

// Layout wrappers and site-wide nav/header/decorative nodes carry no page
// content of their own — recurse into children, emit nothing for themselves.
const SKIP_SILENT = new Set([
  'root', 'ct_div_block', 'ct_section', 'ct_inner_content',
  'oxy_header', 'oxy_header_center', 'oxy_header_left', 'oxy_header_right', 'oxy_header_row',
  'oxy-pro-menu', 'ct_fancy_icon', 'ct_code_block',
]);

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// ponytail: covers only the entities actually present in this dump's content
// (verified during planning). Swap for a full decoder (e.g. `he`) if future
// Oxygen content introduces entities outside this set.
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&apos;': "'",
  '&nbsp;': ' ', '&#8211;': '–', '&#8212;': '—', '&#8216;': '‘', '&#8217;': '’',
  '&#8220;': '“', '&#8221;': '”', '&#8230;': '…',
};

function decodeEntities(text: string): string {
  return text.replace(/&[a-zA-Z0-9#]+;/g, (m) => ENTITY_MAP[m] ?? m);
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function getOriginal(node: OxygenNode): Record<string, unknown> {
  const original = node.options?.original;
  return original && !Array.isArray(original) ? original : {};
}

export function extractOxygenContent(
  builderJsonText: string,
  resolveImageAlt: (src: string) => string | null,
): OxygenExtractResult {
  const notes: string[] = [];
  let root: OxygenNode;
  try {
    root = JSON.parse(builderJsonText);
  } catch {
    notes.push('_ct_builder_json was not valid JSON — could not extract content');
    return { html: '', notes };
  }

  function renderNode(node: OxygenNode): string {
    const name = node.name ?? '';
    const original = getOriginal(node);
    const rawContent = node.options?.ct_content;
    const content = typeof rawContent === 'string' ? decodeEntities(rawContent) : undefined;
    const children = (node.children ?? []).map(renderNode).join('');

    if (name === 'ct_shortcode') {
      const raw = typeof original.full_shortcode === 'string' ? original.full_shortcode : '';
      notes.push(`shortcode found, not rendered — needs manual re-implementation: ${raw}`);
      return `<!-- [SHORTCODE TODO: ${raw.replace(/--/g, '—')}] -->`;
    }
    if (name === 'oxy_posts_grid') {
      notes.push('dynamic post grid widget skipped (superseded by the new /blog route)');
      return '';
    }
    if (SKIP_SILENT.has(name)) {
      return children;
    }
    if (name === 'ct_headline') {
      const tag = typeof original.tag === 'string' && HEADING_TAGS.has(original.tag) ? original.tag : 'h2';
      return `<${tag}>${content ?? children}</${tag}>`;
    }
    if (name === 'ct_text_block' || name === 'oxy_rich_text') {
      if (content === undefined) return children;
      const tag = typeof original.tag === 'string' && original.tag.length > 0 && original.tag !== 'div' ? original.tag : 'p';
      return `<${tag}>${content}</${tag}>`;
    }
    if (name === 'ct_span') {
      return content !== undefined ? content : children;
    }
    if (name === 'ct_image') {
      const src = typeof original.src === 'string' ? original.src : '';
      if (!src) return children;
      const alt = resolveImageAlt(src) ?? '[ALT-TEXT TODO: Bild manuell beschreiben]';
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`;
    }
    if (name === 'ct_link_text' || name === 'ct_link_button') {
      const url = typeof original.url === 'string' ? original.url : '';
      const target = original.target === '_blank' ? ' target="_blank" rel="noopener"' : '';
      const label = content ?? children;
      return url ? `<a href="${escapeAttr(url)}"${target}>${label}</a>` : label;
    }
    if (name === 'ct_link') {
      const url = typeof original.url === 'string' ? original.url : '';
      return url ? `<a href="${escapeAttr(url)}">${children}</a>` : children;
    }
    if (content !== undefined) {
      notes.push(`unknown component type '${name}' with text content — emitted as a paragraph, verify manually`);
      return `<p>${content}</p>`;
    }
    return children;
  }

  return { html: renderNode(root).trim(), notes };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test scripts/migrate/lib/parseOxygenTree.test.ts`
Expected: PASS (11 tests)

- [ ] **Step 5: Sanity-check against one real page (not a unit test — a one-off manual check)**

Run:
```bash
node --import tsx -e "
import { readFileSync } from 'node:fs';
import { parsePostmeta } from './scripts/migrate/lib/parseWpSql.ts';
import { extractOxygenContent } from './scripts/migrate/lib/parseOxygenTree.ts';
const sql = readFileSync('import-source/wp_9bhnv_2026-09-14_13-30-44.sql', 'utf-8');
const postmeta = parsePostmeta(sql);
const blob = postmeta.get('28').find(m => m.key === '_ct_builder_json').value; // Über uns
const { html, notes } = extractOxygenContent(blob, () => null);
console.log(html.slice(0, 500));
console.log('notes:', notes);
"
```
Expected: real German prose about the Verein, not a placeholder string. `notes` may be empty or may list a shortcode/unknown-component finding — read it, don't just check it's non-crashing.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Oxygen builder-JSON extractor — real page content, not placeholders"
```

---

### Task 7: Content transform — WP rows → collection entries

**Files:**
- Create: `scripts/migrate/lib/transformContent.ts`, `scripts/migrate/lib/transformContent.test.ts`

**Interfaces:**
- Consumes: `WpPost` from Task 5; `extractOxygenContent` from Task 6.
- Produces: `CONTENT_REVIEW_PLACEHOLDER` (exported for the test and for the no-Oxygen-data fallback path); `transformPage(post: WpPost, oxygenJson: string | undefined, resolveImageAlt: (src: string) => string | null): { slug: string; data: Page; needsReview: boolean; notes: string[] }`; `transformBlogPost(post: WpPost, coverImageId: string | null): { slug: string; data: { title: string; published_at: string; cover_image: string; content_standard: string }; needsReview: boolean } | null` (returns `null` for posts with no usable title/content, so the caller — Task 9 — can skip and log them). Consumed by `scripts/migrate/run.ts` (Task 9).

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/migrate/lib/transformContent.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transformPage, transformBlogPost } from './transformContent.ts';
import type { WpPost } from './parseWpSql.ts';

function page(overrides: Partial<WpPost> = {}): WpPost {
  return {
    id: '28', postAuthor: '1', postDate: '2024-12-09 16:51:37', postContent: '',
    postTitle: 'Über uns', postExcerpt: '', postStatus: 'publish', postName: 'der-verein',
    postParent: '0', guid: 'https://kuin.at/?page_id=28', postType: 'page', postMimeType: '', ...overrides,
  };
}

const REAL_OXYGEN_JSON = JSON.stringify({
  id: 0, name: 'root', children: [
    { name: 'ct_headline', options: { ct_content: 'Der Verein', original: { tag: 'h1' } } },
    { name: 'ct_text_block', options: { ct_content: 'Der Verein wurde 2023 gegründet.', original: { tag: 'p' } } },
  ],
});

test('transformPage extracts real content from Oxygen builder JSON when present', () => {
  const result = transformPage(page(), REAL_OXYGEN_JSON, () => null);
  assert.equal(result.slug, 'der-verein');
  assert.equal(result.data.title, 'Über uns');
  assert.match(result.data.content_standard, /gegründet/);
  assert.equal(result.needsReview, false);
  assert.deepEqual(result.notes, []);
  assert.equal(result.data.content_leicht_lesen, undefined);
});

test('transformPage surfaces extractor notes (e.g. a shortcode) as needsReview, without discarding the rest of the content', () => {
  const jsonWithShortcode = JSON.stringify({
    id: 0, name: 'root', children: [
      { name: 'ct_headline', options: { ct_content: 'Kontakt', original: { tag: 'h1' } } },
      { name: 'ct_shortcode', options: { original: { full_shortcode: '[fluentform id=3]' } } },
    ],
  });
  const result = transformPage(page({ postName: 'kontakt' }), jsonWithShortcode, () => null);
  assert.equal(result.needsReview, true);
  assert.equal(result.notes.length, 1);
  assert.match(result.data.content_standard, /Kontakt/);
});

test('transformPage falls back to post_content and flags needsReview when no Oxygen data exists at all', () => {
  const result = transformPage(page({ postContent: '' }), undefined, () => null);
  assert.equal(result.needsReview, true);
  assert.match(result.data.content_standard, /manuell/i);
});

test('transformPage uses real post_content when Oxygen data is absent but post_content has text', () => {
  const result = transformPage(page({ postContent: '<p>Hallo</p>' }), undefined, () => null);
  assert.match(result.data.content_standard, /Hallo/);
  assert.equal(result.needsReview, false);
});

test('transformPage flags needsReview for non-publish status even with good Oxygen content', () => {
  const result = transformPage(page({ postStatus: 'draft' }), REAL_OXYGEN_JSON, () => null);
  assert.equal(result.needsReview, true);
});

test('transformBlogPost returns null for revision/attachment rows (not real posts)', () => {
  const result = transformBlogPost(page({ postType: 'revision' }), null);
  assert.equal(result, null);
});

test('transformBlogPost sets content_leicht_lesen placeholder marker, never silently empty', () => {
  const result = transformBlogPost(page({ postType: 'post', postTitle: 'Neuigkeiten', postName: 'neuigkeiten', postContent: '<p>Text</p>' }), 'media-123');
  assert.equal(result?.data.content_leicht_lesen, undefined); // optional field, omitted not faked
  assert.equal(result?.needsReview, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test scripts/migrate/lib/transformContent.test.ts`
Expected: FAIL — `Cannot find module './transformContent.ts'`

- [ ] **Step 3: Implement `scripts/migrate/lib/transformContent.ts`**

```typescript
import type { WpPost } from './parseWpSql.ts';
import type { Page } from '../../../src/schemas/page.ts';
import { extractOxygenContent } from './parseOxygenTree.ts';

export const CONTENT_REVIEW_PLACEHOLDER =
  '<p><em>[INHALT TODO: Für diese Seite konnte kein verwertbarer Inhalt ' +
  'extrahiert werden — manuell aus der Live-Vorschau von kuin.at übertragen.]</em></p>';

export function stripToText(html: string): string {
  return html.replace(/<!--.*?-->/gs, '').trim();
}

export function transformPage(
  post: WpPost,
  oxygenJson: string | undefined,
  resolveImageAlt: (src: string) => string | null,
): { slug: string; data: Page; needsReview: boolean; notes: string[] } {
  const isPublished = post.postStatus === 'publish';

  if (oxygenJson) {
    const { html, notes } = extractOxygenContent(oxygenJson, resolveImageAlt);
    const isUsable = html.trim().length > 0 && isPublished;
    return {
      slug: post.postName,
      data: {
        title: post.postTitle,
        content_standard: isUsable ? html : CONTENT_REVIEW_PLACEHOLDER,
        seo_description: post.postExcerpt || undefined,
      },
      needsReview: !isUsable || notes.length > 0,
      notes,
    };
  }

  // No Oxygen data for this page at all (e.g. a draft never built in the
  // page builder) — fall back to whatever plain post_content has.
  const content = stripToText(post.postContent);
  const isUsable = content.length > 0 && isPublished;
  return {
    slug: post.postName,
    data: {
      title: post.postTitle,
      content_standard: isUsable ? content : CONTENT_REVIEW_PLACEHOLDER,
      seo_description: post.postExcerpt || undefined,
    },
    needsReview: !isUsable,
    notes: [],
  };
}

export function transformBlogPost(
  post: WpPost,
  coverImageId: string | null,
): { slug: string; data: { title: string; published_at: string; cover_image: string; content_standard: string }; needsReview: boolean } | null {
  if (post.postType !== 'post') return null;
  const content = stripToText(post.postContent);
  const isUsable = content.length > 0;
  return {
    slug: post.postName,
    data: {
      title: post.postTitle,
      published_at: new Date(post.postDate.replace(' ', 'T') + 'Z').toISOString(),
      cover_image: coverImageId ?? '',
      content_standard: isUsable ? content : CONTENT_REVIEW_PLACEHOLDER,
    },
    needsReview: !isUsable || !coverImageId,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test scripts/migrate/lib/transformContent.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: transform WP pages via real Oxygen extraction, blog posts via post_content"
```

---

### Task 8: Media migration — `uploads/` → Orbiter media library

**Files:**
- Create: `scripts/migrate/lib/migrateMedia.ts`, `scripts/migrate/lib/migrateMedia.test.ts`

**Interfaces:**
- Consumes: the `Map` from `parsePostmeta` (Task 5) for `_wp_attachment_image_alt` lookups.
- Produces: `isResizedVariant(filename: string): boolean`, `resolveAltText(postId: string, filename: string, postmeta: Map<string, Array<{key: string; value: string}>>): string`, `collectOriginalMediaFiles(uploadsDir: string): string[]` (absolute paths, WP size-variants filtered out). Consumed by `scripts/migrate/run.ts` (Task 9), which also uses `resolveAltText` to build the `src → alt` resolver that Task 7's Oxygen extractor needs for `ct_image` nodes.

- [ ] **Step 1: Write the failing test**

```typescript
// scripts/migrate/lib/migrateMedia.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { isResizedVariant, resolveAltText, collectOriginalMediaFiles, ALT_TEXT_PLACEHOLDER } from './migrateMedia.ts';

test('isResizedVariant detects WordPress size suffixes', () => {
  assert.equal(isResizedVariant('Graz-Logo-1024x1024.png'), true);
  assert.equal(isResizedVariant('Graz-Logo-350x100.png'), true);
  assert.equal(isResizedVariant('Graz-Logo.png'), false);
  assert.equal(isResizedVariant('photo-by-yomex-owo.jpg'), false);
});

test('resolveAltText returns WP alt text when present', () => {
  const meta = new Map([['14', [{ key: '_wp_attachment_image_alt', value: 'Das KUIN Logo' }]]]);
  assert.equal(resolveAltText('14', 'KUIN-Logo.svg', meta), 'Das KUIN Logo');
});

test('resolveAltText falls back to a visible placeholder when WP has no alt text', () => {
  const meta = new Map<string, Array<{ key: string; value: string }>>();
  assert.equal(resolveAltText('99', 'photo-by-steve-johnson.jpg', meta), ALT_TEXT_PLACEHOLDER);
});

test('collectOriginalMediaFiles skips resized variants and non-media files, keeps originals', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'kuin-media-test-'));
  try {
    writeFileSync(path.join(dir, 'Graz-Logo.png'), '');
    writeFileSync(path.join(dir, 'Graz-Logo-300x300.png'), '');
    writeFileSync(path.join(dir, 'Graz-Logo-1024x1024.png'), '');
    writeFileSync(path.join(dir, 'index.php'), '');
    writeFileSync(path.join(dir, 'Manifest.pdf'), '');
    const files = collectOriginalMediaFiles(dir).map((f) => path.basename(f)).sort();
    assert.deepEqual(files, ['Graz-Logo.png', 'Manifest.pdf']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test scripts/migrate/lib/migrateMedia.test.ts`
Expected: FAIL — `Cannot find module './migrateMedia.ts'`

- [ ] **Step 3: Implement `scripts/migrate/lib/migrateMedia.ts`**

```typescript
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

export const ALT_TEXT_PLACEHOLDER = '[ALT-TEXT TODO: Bild manuell beschreiben]';

const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf', '.gif']);
const RESIZE_SUFFIX = /-\d+x\d+$/;

export function isResizedVariant(filename: string): boolean {
  const base = path.basename(filename, path.extname(filename));
  return RESIZE_SUFFIX.test(base);
}

export function resolveAltText(
  postId: string,
  filename: string,
  postmeta: Map<string, Array<{ key: string; value: string }>>,
): string {
  const meta = postmeta.get(postId) ?? [];
  const alt = meta.find((m) => m.key === '_wp_attachment_image_alt')?.value;
  return alt && alt.trim().length > 0 ? alt : ALT_TEXT_PLACEHOLDER;
}

export function collectOriginalMediaFiles(uploadsDir: string): string[] {
  const results: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) { walk(full); continue; }
      const ext = path.extname(entry).toLowerCase();
      if (!MEDIA_EXTENSIONS.has(ext)) continue;
      if (isResizedVariant(entry)) continue;
      results.push(full);
    }
  };
  walk(uploadsDir);
  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test scripts/migrate/lib/migrateMedia.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: media migration helpers — variant filtering + alt-text fallback"
```

---

### Task 9: Migration orchestrator

**Files:**
- Create: `scripts/migrate/run.ts`

**Interfaces:**
- Consumes: `createKuinCollections` (Task 4), `parsePosts`/`parsePostmeta` (Task 5), `extractOxygenContent` indirectly via `transformPage` (Task 6/7), `transformPage`/`transformBlogPost` (Task 7), `collectOriginalMediaFiles`/`resolveAltText` (Task 8), `openPod`/`db.insertMedia`/`db.createEntry` from `@a83/orbiter-core`.
- Produces: a runnable script (`npm run migrate`) that creates `content.pod`, populates all migrated media and entries — with real extracted page content, not placeholders, wherever Oxygen data exists — and prints a review report. No other task consumes this directly — it's the end-user-facing entry point.

- [ ] **Step 1: Implement `scripts/migrate/run.ts`**

```typescript
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openPod } from '@a83/orbiter-core';
import { createKuinCollections } from '../setup-collections.ts';
import { parsePosts, parsePostmeta } from './lib/parseWpSql.ts';
import { transformPage, transformBlogPost } from './lib/transformContent.ts';
import { collectOriginalMediaFiles, resolveAltText } from './lib/migrateMedia.ts';

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + '/../..';
const SQL_PATH = path.join(ROOT, 'import-source/wp_9bhnv_2026-09-14_13-30-44.sql');
const UPLOADS_DIR = path.join(ROOT, 'import-source/uploads');
const POD_PATH = path.join(ROOT, 'content.pod');

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.gif': 'image/gif',
};

async function main() {
  const needsReview: string[] = [];

  console.log('→ creating collections');
  createKuinCollections(POD_PATH);
  const db = openPod(POD_PATH);

  const sql = readFileSync(SQL_PATH, 'utf-8');
  const posts = parsePosts(sql);
  const postmeta = parsePostmeta(sql);

  console.log('→ migrating media');
  const mediaIdByFilename = new Map<string, string>();
  const altByFilename = new Map<string, string>();
  // Attachment guids are unreliable for this join — many use pretty
  // permalinks or `?attachment_id=N` rather than the raw upload URL (and,
  // confirmed against the real dump, it's exactly the attachments with real
  // legacy alt text that use this guid style — a naive `guid.endsWith(...)`
  // join silently misses all of them). The `_wp_attached_file` postmeta
  // always holds the real relative upload path, so match on that instead.
  const attachmentByFilename = new Map<string, (typeof posts)[number]>();
  for (const p of posts) {
    if (p.postType !== 'attachment') continue;
    const attachedFile = (postmeta.get(p.id) ?? []).find((m) => m.key === '_wp_attached_file')?.value;
    if (attachedFile) attachmentByFilename.set(path.basename(attachedFile), p);
  }
  for (const filePath of collectOriginalMediaFiles(UPLOADS_DIR)) {
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream';
    const data = readFileSync(filePath);
    const attachmentPost = attachmentByFilename.get(filename);
    const alt = attachmentPost ? resolveAltText(attachmentPost.id, filename, postmeta) : '[ALT-TEXT TODO: Bild manuell beschreiben]';
    if (alt.startsWith('[ALT-TEXT')) needsReview.push(`media: ${filename} — no alt text in legacy data`);
    const id = randomUUID();
    db.insertMedia(id, filename, mime, data.length, data, alt);
    mediaIdByFilename.set(filename, id);
    altByFilename.set(filename, alt);
  }
  console.log(`  uploaded ${mediaIdByFilename.size} original media files`);

  // Oxygen's ct_image nodes reference the original upload URL directly
  // (e.g. https://kuin.at/wp-content/uploads/2024/05/KUIN-Logo.svg) — match
  // by filename against what was just uploaded.
  function resolveImageAltBySrc(src: string): string | null {
    const filename = path.basename(src.split('?')[0]);
    return altByFilename.get(filename) ?? null;
  }

  console.log('→ migrating pages (extracting real content from Oxygen builder JSON)');
  let pageCount = 0;
  const usedPageSlugs = new Set<string>();
  for (const post of posts.filter((p) => p.postType === 'page')) {
    if (!post.postName) continue;
    const oxygenJson = (postmeta.get(post.id) ?? []).find((m) => m.key === '_ct_builder_json')?.value;
    let { slug, data, needsReview: flagged, notes } = transformPage(post, oxygenJson, resolveImageAltBySrc);
    // WP allows the same post_name across posts with different statuses —
    // confirmed in the real dump: id 20 "Landing" (published) and id 479
    // "Landing #3" (draft) both have post_name 'landing'. Orbiter enforces
    // a unique slug per collection, so disambiguate and flag for review.
    if (usedPageSlugs.has(slug)) {
      const original = slug;
      slug = `${slug}-${post.id}`;
      needsReview.push(`pages/${slug}: slug collided with another page's "${original}" — auto-renamed, verify/fix manually`);
    }
    usedPageSlugs.add(slug);
    db.createEntry('pages', slug, data, post.postStatus === 'publish' ? 'published' : 'draft');
    pageCount++;
    for (const note of notes) needsReview.push(`pages/${slug}: ${note}`);
    if (flagged && notes.length === 0) needsReview.push(`pages/${slug}: content needs manual review (no Oxygen data, or non-publish status)`);
  }
  console.log(`  migrated ${pageCount} pages`);

  console.log('→ migrating blog posts');
  let blogCount = 0;
  for (const post of posts.filter((p) => p.postType === 'post')) {
    const thumbMeta = (postmeta.get(post.id) ?? []).find((m) => m.key === '_thumbnail_id');
    // Same guid unreliability as the media-alt join above — resolve the
    // thumbnail attachment's real filename via _wp_attached_file.
    const attachedFile = thumbMeta ? (postmeta.get(thumbMeta.value) ?? []).find((m) => m.key === '_wp_attached_file')?.value : undefined;
    const coverImageId = attachedFile ? mediaIdByFilename.get(path.basename(attachedFile)) ?? null : null;
    const result = transformBlogPost(post, coverImageId);
    if (!result) continue;
    db.createEntry('blog', result.slug, result.data, post.postStatus === 'publish' ? 'published' : 'draft');
    blogCount++;
    if (result.needsReview) needsReview.push(`blog/${result.slug}: content or cover image needs manual review`);
  }
  console.log(`  migrated ${blogCount} blog posts`);

  console.log('→ partners/events/archive/downloads have no structured per-entry legacy data');
  needsReview.push('partners: no structured legacy data — add manually from partner logo SVGs in import-source/uploads/2025/02/');
  needsReview.push("events: the WP 'Veranstaltungen' page was an intro page only (migrated into Pages) — add individual Events manually");
  needsReview.push("archive: the WP 'Archiv' page was an intro page only (migrated into Pages) — add individual year galleries manually");
  needsReview.push('downloads: only KUIN-Manifest.pdf found as a clear download — verify others manually');

  db.close();

  console.log(`\n=== Migration report: ${needsReview.length} items need manual follow-up ===`);
  for (const item of needsReview) console.log(' -', item);
}

main();
```

- [ ] **Step 2: Add the npm script**

```json
"scripts": { "migrate": "node --import tsx scripts/migrate/run.ts" }
```

- [ ] **Step 3: Run it against the real data**

Run: `npm run migrate`
Expected: creates `content.pod`, prints media/page/blog counts matching the real dump — **207 original media files** (971 total files in `uploads/`, 764 of which are WordPress-generated resize variants correctly filtered out — verified by hand during a real run: every "variant" filename has a same-named-without-suffix original next to it, 971 = 207 + 764 exactly), 13 pages, 25 posts. Of the 13 pages, 11 published ones get real extracted body content from Oxygen (not placeholders) — spot-check a couple against the live site at kuin.at to confirm the text actually matches; the `Privacy Policy` and `Landing #3` drafts are expected to show in the review list (non-publish status), and `Landing #3` additionally triggers the slug-collision handling above since it shares `post_name = 'landing'` with the real published Landing page. No uncaught exceptions.

- [ ] **Step 4: Append the real counts to `stage.md`'s Log section**, then commit.

```bash
git add -A
git commit -m "feat: migration orchestrator — one-shot WP to Orbiter import with real Oxygen content"
```

---

### Task 10: `leichtLesenStore` — global Nano Store

**Files:**
- Create: `src/stores/leichtLesenStore.ts`, `src/stores/leichtLesenStore.test.ts`

**Interfaces:**
- Produces: `leichtLesenStore: PersistentAtom<boolean>` (from `@nanostores/persistent`), `toggleLeichtLesen(): void`, `setLeichtLesen(value: boolean): void`. Consumed by `LeichtLesenToggle.astro` (Task 11) and `src/lib/content.ts` (Task 12, client-side re-render path).

- [ ] **Step 1: Write the failing test**

```typescript
// src/stores/leichtLesenStore.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

// @nanostores/persistent reads `globalThis.localStorage` — stub it before import.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}
(globalThis as any).localStorage = new MemoryStorage();
(globalThis as any).addEventListener ??= () => {};

const { leichtLesenStore, toggleLeichtLesen, setLeichtLesen } = await import('./leichtLesenStore.ts');

test('defaults to false', () => {
  assert.equal(leichtLesenStore.get(), false);
});

test('toggleLeichtLesen flips the value', () => {
  setLeichtLesen(false);
  toggleLeichtLesen();
  assert.equal(leichtLesenStore.get(), true);
  toggleLeichtLesen();
  assert.equal(leichtLesenStore.get(), false);
});

test('setLeichtLesen sets an explicit value', () => {
  setLeichtLesen(true);
  assert.equal(leichtLesenStore.get(), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/stores/leichtLesenStore.test.ts`
Expected: FAIL — `Cannot find module './leichtLesenStore.ts'`

- [ ] **Step 3: Implement `src/stores/leichtLesenStore.ts`**

```typescript
import { persistentAtom } from '@nanostores/persistent';

export const leichtLesenStore = persistentAtom<boolean>('kuin:leicht-lesen', false, {
  encode: (v) => String(v),
  decode: (v) => v === 'true',
});

export function toggleLeichtLesen(): void {
  leichtLesenStore.set(!leichtLesenStore.get());
}

export function setLeichtLesen(value: boolean): void {
  leichtLesenStore.set(value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/stores/leichtLesenStore.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: leichtLesenStore global toggle via @nanostores/persistent"
```

---

### Task 11: Accessible Header + Leicht-Lesen toggle

**Files:**
- Create: `src/components/LeichtLesenToggle.astro`, `src/components/Header.astro`
- Modify: `src/layouts/BaseLayout.astro` (render `<Header />`)

**Interfaces:**
- Consumes: `leichtLesenStore`, `toggleLeichtLesen` from Task 10.
- Produces: `<Header active?: string />` rendered by every page (Task 12, 13). No props consumed besides `active` for nav-current-page styling.

- [ ] **Step 1: Implement `src/components/LeichtLesenToggle.astro`**

A native `<button>` is keyboard-operable (Space/Enter) with zero extra JS for
that part — no custom `role="switch"` + manual `keydown` handler needed.
`aria-pressed` is the only ARIA attribute required for a toggle button.

```astro
<button
  id="leicht-lesen-toggle"
  type="button"
  aria-pressed="false"
  class="rounded-md border border-slate-500 px-3 py-2 text-sm font-medium text-ink hover:bg-teal-500/10 focus-visible:outline-none"
>
  Leicht Lesen
</button>

<script>
  import { leichtLesenStore, toggleLeichtLesen } from '../stores/leichtLesenStore';

  const button = document.getElementById('leicht-lesen-toggle') as HTMLButtonElement;

  function render(active: boolean) {
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('bg-teal-500/20', active);
  }

  render(leichtLesenStore.get());
  leichtLesenStore.subscribe(render);
  button.addEventListener('click', () => toggleLeichtLesen());
</script>
```

- [ ] **Step 2: Implement `src/components/Header.astro`**

Semantic landmarks only — `<header>` containing `<nav aria-label="Hauptnavigation">`,
no wrapping `<div>` soup.

```astro
---
import LeichtLesenToggle from './LeichtLesenToggle.astro';
interface Props { active?: string }
const { active } = Astro.props;
const links = [
  { href: '/', label: 'Start', id: 'home' },
  { href: '/blog', label: 'Blog', id: 'blog' },
  { href: '/events', label: 'Veranstaltungen', id: 'events' },
  { href: '/archiv', label: 'Archiv', id: 'archiv' },
  { href: '/partner', label: 'Partner', id: 'partner' },
  { href: '/ueber-uns', label: 'Über uns', id: 'ueber-uns' },
];
---
<header class="border-b border-slate-500/20">
  <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
    <a href="/" class="text-lg font-bold text-rose-700">KUIN</a>
    <nav aria-label="Hauptnavigation">
      <ul class="flex flex-wrap gap-4">
        {links.map((link) => (
          <li>
            <a
              href={link.href}
              aria-current={active === link.id ? 'page' : undefined}
              class="text-sm font-medium text-ink hover:text-teal-700"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
    <LeichtLesenToggle />
  </div>
</header>
```

- [ ] **Step 3: Wire it into `BaseLayout.astro`**

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
interface Props { title: string; description?: string; active?: string }
const { title, description = 'Kultur Inklusiv Graz — Kunst und Kultur barrierefrei erleben.', active } = Astro.props;
---
<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} · KUIN</title>
  <meta name="description" content={description} />
</head>
<body class="bg-bg text-ink">
  <Header active={active} />
  <slot />
</body>
</html>
```

- [ ] **Step 4: Manual accessibility verification (no automated UI test — documented golden-path check)**

Run: `npm run dev`, open `http://localhost:4321/`.
Check:
1. Tab from the page load — focus lands on the KUIN logo link first, then nav links, then the Leicht-Lesen button, each with a visible teal focus ring (`:focus-visible` from Task 2).
2. Press Space or Enter on the focused Leicht-Lesen button — `aria-pressed` flips `false → true`, button gets the teal active background. Reload the page — the toggle state persists (via `@nanostores/persistent`'s `localStorage` backing).
3. Inspect the DOM: confirm `<nav aria-label="Hauptnavigation">` exists and the current page's link has `aria-current="page"`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: accessible Header with native-button Leicht-Lesen toggle"
```

---

### Task 12: Content resolution helper + Pages/Blog/Events routes

**Files:**
- Create: `src/lib/content.ts`, `src/lib/content.test.ts`, `src/pages/index.astro` (replace placeholder), `src/pages/[slug].astro`, `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/pages/events/index.astro`, `src/pages/events/[slug].astro`

**Interfaces:**
- Produces: `getDisplayContent<T extends Record<string, unknown>>(entry: T, standardKey: keyof T, leichtLesenKey: keyof T, leichtLesenActive: boolean): string` — the one function every route with a standard/leicht-lesen pair calls.

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/content.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayContent } from './content.ts';

test('returns standard content when Leicht Lesen is off', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: 'Einfacher Text' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', false), 'Standard-Text');
});

test('returns leicht-lesen content when toggle is on and the field is present', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: 'Einfacher Text' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Einfacher Text');
});

test('falls back to standard content when toggle is on but leicht-lesen field is missing', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: undefined };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Standard-Text');
});

test('falls back to standard content when leicht-lesen field is an empty string', () => {
  const entry = { content_standard: 'Standard-Text', content_leicht_lesen: '' };
  assert.equal(getDisplayContent(entry, 'content_standard', 'content_leicht_lesen', true), 'Standard-Text');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/content.test.ts`
Expected: FAIL — `Cannot find module './content.ts'`

- [ ] **Step 3: Implement `src/lib/content.ts`**

```typescript
export function getDisplayContent<T extends Record<string, unknown>>(
  entry: T,
  standardKey: keyof T,
  leichtLesenKey: keyof T,
  leichtLesenActive: boolean,
): string {
  const standard = String(entry[standardKey] ?? '');
  if (!leichtLesenActive) return standard;
  const leicht = entry[leichtLesenKey];
  return typeof leicht === 'string' && leicht.trim().length > 0 ? leicht : standard;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/content.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: `src/pages/[slug].astro` — Pages collection, server-read cookie drives Leicht Lesen for the initial SSR paint**

The store is `localStorage`-backed (client-only), so the *server-rendered*
markup can't read it on first load — read a plain cookie the toggle script
also writes, so a hard refresh keeps the reader's choice server-side too
(progressive enhancement: works with JS off, just always shows Standard).

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection, getEntry } from 'orbiter:collections';
import { getDisplayContent } from '../lib/content';
import { PageSchema, PartnerSchema } from '../schemas';

export async function getStaticPaths() {
  const pages = await getCollection('pages');
  return pages.map((p) => ({ params: { slug: p.slug } }));
}

const { slug } = Astro.params;
const entry = await getEntry('pages', slug!);
if (!entry) return Astro.redirect('/404');

const data = PageSchema.parse(entry.data);
const leichtLesenActive = Astro.cookies.get('kuin-leicht-lesen')?.value === 'true';
const content = getDisplayContent(data, 'content_standard', 'content_leicht_lesen', leichtLesenActive);

// The Kontakt page additionally shows the board and a named contact for
// inquiries — requested directly by the client, not derivable from the
// legacy WP data. Board names are pulled live from Partners
// (is_board_member) rather than hardcoded, so the list stays correct as
// the board changes; the contact name/email is fixed on this one page.
const isKontakt = slug === 'kontakt';
const board = isKontakt
  ? (await getCollection('partners')).map((e) => PartnerSchema.parse(e.data)).filter((p) => p.is_board_member)
  : [];
---
<BaseLayout title={data.title} description={data.seo_description}>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="mb-6 text-3xl font-bold text-ink">{data.title}</h1>
    <article class="prose" set:html={content} />

    {isKontakt && (
      <section class="mt-10 border-t border-slate-500/20 pt-8">
        <h2 class="mb-4 text-xl font-semibold text-ink">Vorstand</h2>
        {board.length > 0 ? (
          <ul class="mb-6 flex flex-wrap gap-x-6 gap-y-1">
            {board.map((p) => <li>{p.name}</li>)}
          </ul>
        ) : (
          <p class="mb-6 text-slate-700"><em>[TODO: Vorstandsmitglieder in der Partners-Collection als is_board_member eintragen — ein Vorstandsfoto kann direkt im Rich-Text-Editor dieser Seite ergänzt werden.]</em></p>
        )}
        <p class="text-ink">
          Für Anfragen wenden Sie sich bitte an <strong>Anita Brodtrager</strong>:
          {' '}<a href="mailto:office@kuin.at" class="text-teal-700 underline">office@kuin.at</a>
        </p>
      </section>
    )}
  </main>
</BaseLayout>
```

The board photo itself has no legacy source and no dedicated schema field —
it gets added by an editor directly into the Kontakt page's rich-text
content via the Orbiter admin (an `<img>` with a real `alt`, same as any
other content image), not hardcoded into the template. Note this in
`stage.md`'s remaining manual work.

- [ ] **Step 6: Write the cookie in `LeichtLesenToggle.astro`'s script** (so `Astro.cookies` in every route sees it) — add one line to the script from Task 11:

```js
// inside the existing button click handler, after toggleLeichtLesen():
document.cookie = `kuin-leicht-lesen=${leichtLesenStore.get()}; path=/; max-age=31536000; samesite=lax`;
```

- [ ] **Step 7: `src/pages/blog/index.astro` and `src/pages/blog/[slug].astro`**

```astro
---
// src/pages/blog/index.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'orbiter:collections';

const posts = (await getCollection('blog'))
  .filter((p) => p.data.published_at)
  .sort((a, b) => new Date(b.data.published_at).getTime() - new Date(a.data.published_at).getTime());
---
<BaseLayout title="Blog" active="blog">
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="mb-6 text-3xl font-bold">Blog</h1>
    <ul class="flex flex-col gap-6">
      {posts.map((post) => (
        <li>
          <article>
            <h2 class="text-xl font-semibold"><a href={`/blog/${post.slug}`}>{post.data.title}</a></h2>
            <time datetime={post.data.published_at} class="text-sm text-slate-700">
              {new Date(post.data.published_at).toLocaleDateString('de-AT', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </article>
        </li>
      ))}
    </ul>
  </main>
</BaseLayout>
```

```astro
---
// src/pages/blog/[slug].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, getEntry } from 'orbiter:collections';
import { getMediaItem } from 'orbiter:media';
import { getDisplayContent } from '../../lib/content';
import { BlogPostSchema } from '../../schemas';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((p) => ({ params: { slug: p.slug } }));
}

const { slug } = Astro.params;
const entry = await getEntry('blog', slug!);
if (!entry) return Astro.redirect('/404');

const data = BlogPostSchema.parse(entry.data);
const coverImage = await getMediaItem(data.cover_image);
const leichtLesenActive = Astro.cookies.get('kuin-leicht-lesen')?.value === 'true';
const content = getDisplayContent(data, 'content_standard', 'content_leicht_lesen', leichtLesenActive);
---
<BaseLayout title={data.title} active="blog">
  <main class="mx-auto max-w-3xl px-4 py-10">
    <article>
      <h1 class="mb-2 text-3xl font-bold">{data.title}</h1>
      <time datetime={data.published_at} class="mb-6 block text-sm text-slate-700">
        {new Date(data.published_at).toLocaleDateString('de-AT', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      {coverImage && (
        <img src={coverImage.url} alt={coverImage.alt ?? '[ALT-TEXT TODO: Bild manuell beschreiben]'} class="mb-6 rounded-md" />
      )}
      <div class="prose" set:html={content} />
    </article>
  </main>
</BaseLayout>
```

`cover_image` stores the Orbiter media id; `getMediaItem` (from the
`orbiter:media` virtual module `@a83/orbiter-integration` already provides —
confirmed in its source during planning, not assumed) resolves it to
`{url, alt, filename, ...}` at request time, so the required alt text — set
on the `_media` row itself when the media was uploaded in Task 8/9 — reaches
the page without ever being duplicated into the blog entry's own data.

- [ ] **Step 8: `src/pages/events/index.astro` and `src/pages/events/[slug].astro`** — same shape as blog, swapping `description_standard`/`description_leicht_lesen` and rendering `location`, `start_date`–`end_date`, and `accessibility_features` as a `<ul>` of `<li>` chips.

```astro
---
// src/pages/events/[slug].astro
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection, getEntry } from 'orbiter:collections';
import { getDisplayContent } from '../../lib/content';
import { EventSchema } from '../../schemas';

export async function getStaticPaths() {
  const events = await getCollection('events');
  return events.map((e) => ({ params: { slug: e.slug } }));
}

const { slug } = Astro.params;
const entry = await getEntry('events', slug!);
if (!entry) return Astro.redirect('/404');

const data = EventSchema.parse(entry.data);
const leichtLesenActive = Astro.cookies.get('kuin-leicht-lesen')?.value === 'true';
const content = getDisplayContent(data, 'description_standard', 'description_leicht_lesen', leichtLesenActive);
---
<BaseLayout title={data.title} active="events">
  <main class="mx-auto max-w-3xl px-4 py-10">
    <article>
      <h1 class="mb-2 text-3xl font-bold">{data.title}</h1>
      <p class="mb-1 text-slate-700">
        <time datetime={data.start_date}>{new Date(data.start_date).toLocaleString('de-AT')}</time>
        {' – '}
        <time datetime={data.end_date}>{new Date(data.end_date).toLocaleString('de-AT')}</time>
      </p>
      <p class="mb-6 text-slate-700">{data.location}</p>
      {data.accessibility_features.length > 0 && (
        <ul class="mb-6 flex flex-wrap gap-2">
          {data.accessibility_features.map((f) => (
            <li class="rounded-md border border-teal-700 px-2 py-1 text-sm text-teal-700">{f}</li>
          ))}
        </ul>
      )}
      <div class="prose" set:html={content} />
    </article>
  </main>
</BaseLayout>
```

`events/index.astro` mirrors `blog/index.astro`, sorted by `start_date` ascending, listing `title`, `start_date`, `location`.

- [ ] **Step 9: Update `src/pages/index.astro` to list the 3 most recent blog posts and next 3 upcoming events** (same data-fetch pattern as Steps 7/8, no new concepts — keep it short).

- [ ] **Step 10: Build and manually verify**

Run: `npm run build`
Then `npm run dev`, open a migrated page (e.g. `/der-verein` if that slug survived migration) and a blog post, toggle Leicht Lesen, reload — confirm content swaps and the cookie-based SSR fallback matches the client store after reload.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: content.ts helper + Pages/Blog/Events dynamic routes with Leicht-Lesen"
```

---

### Task 13: Archive, Partners, Downloads listing pages

**Files:**
- Create: `src/pages/archiv/index.astro`, `src/pages/partner/index.astro`, `src/pages/downloads/index.astro`

**Interfaces:**
- Consumes: `ArchiveSchema`, `PartnerSchema`, `DownloadSchema` from Task 3; `getCollection` from `orbiter:collections`; `getMediaItem` from `orbiter:media` (to resolve `logo`/`file` media-id strings to `{url, alt, filename}`, same pattern as Task 12's blog cover image). No Leicht-Lesen branch — these collections have no `_leicht_lesen` field pair per agent.md.

- [ ] **Step 1: `src/pages/archiv/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'orbiter:collections';
import { ArchiveSchema } from '../../schemas';

const archives = (await getCollection('archive'))
  .map((e) => ArchiveSchema.parse(e.data))
  .sort((a, b) => b.year - a.year);
---
<BaseLayout title="Archiv" active="archiv">
  <main class="mx-auto max-w-5xl px-4 py-10">
    <h1 class="mb-6 text-3xl font-bold">Archiv — Rückblicke</h1>
    {archives.map((archive) => (
      <section class="mb-10">
        <h2 class="mb-2 text-xl font-semibold">{archive.title} ({archive.year})</h2>
        {archive.description && <p class="mb-4 text-slate-700">{archive.description}</p>}
        <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {archive.images.map((img) => (
            <li>
              <figure>
                <img src={img.image_url} alt={img.alt_text} class="rounded-md" loading="lazy" />
                {img.caption && <figcaption class="mt-1 text-sm text-slate-700">{img.caption}</figcaption>}
              </figure>
            </li>
          ))}
        </ul>
      </section>
    ))}
  </main>
</BaseLayout>
```

- [ ] **Step 2: `src/pages/partner/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'orbiter:collections';
import { getMediaItem } from 'orbiter:media';
import { PartnerSchema } from '../../schemas';

const partners = (await getCollection('partners')).map((e) => PartnerSchema.parse(e.data));
const withLogos = await Promise.all(
  partners.map(async (p) => ({ ...p, logoMedia: await getMediaItem(p.logo) }))
);
const board = withLogos.filter((p) => p.is_board_member);
const network = withLogos.filter((p) => !p.is_board_member);
---
<BaseLayout title="Partner & Netzwerk" active="partner">
  <main class="mx-auto max-w-5xl px-4 py-10">
    <h1 class="mb-8 text-3xl font-bold">Partner & Netzwerk</h1>

    {board.length > 0 && (
      <section class="mb-10">
        <h2 class="mb-4 text-xl font-semibold">Vorstand</h2>
        <ul class="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {board.map((p) => (
            <li class="flex flex-col items-center gap-2">
              <img src={p.logoMedia?.url} alt={p.logoMedia?.alt ?? '[ALT-TEXT TODO: Bild manuell beschreiben]'} class="h-16 object-contain" />
              <span class="text-sm">{p.name}</span>
            </li>
          ))}
        </ul>
      </section>
    )}

    <section>
      <h2 class="mb-4 text-xl font-semibold">Netzwerk</h2>
      <ul class="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {network.map((p) => (
          <li class="flex flex-col items-center gap-2">
            {p.website_url
              ? <a href={p.website_url} rel="noopener"><img src={p.logoMedia?.url} alt={p.logoMedia?.alt ?? '[ALT-TEXT TODO: Bild manuell beschreiben]'} class="h-16 object-contain" /></a>
              : <img src={p.logoMedia?.url} alt={p.logoMedia?.alt ?? '[ALT-TEXT TODO: Bild manuell beschreiben]'} class="h-16 object-contain" />}
            <span class="text-sm">{p.name}</span>
          </li>
        ))}
      </ul>
    </section>
  </main>
</BaseLayout>
```

- [ ] **Step 3: `src/pages/downloads/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { getCollection } from 'orbiter:collections';
import { getMediaItem } from 'orbiter:media';
import { DownloadSchema } from '../../schemas';

const parsed = (await getCollection('downloads')).map((e) => DownloadSchema.parse(e.data));
const downloads = await Promise.all(
  parsed.map(async (d) => ({ ...d, fileMedia: await getMediaItem(d.file) }))
);
---
<BaseLayout title="Downloads" active="downloads">
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="mb-6 text-3xl font-bold">Downloads</h1>
    <ul class="flex flex-col gap-4">
      {downloads.map((d) => (
        <li class="flex items-baseline justify-between gap-4 border-b border-slate-500/20 pb-4">
          <div>
            <p class="font-medium">{d.title}</p>
            {d.description && <p class="text-sm text-slate-700">{d.description}</p>}
          </div>
          <a href={d.fileMedia?.url} class="shrink-0 rounded-md border border-teal-700 px-3 py-1 text-sm text-teal-700">
            Herunterladen
          </a>
        </li>
      ))}
    </ul>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: exits 0.

Run: `npm run dev`, visit `/archiv`, `/partner`, `/downloads` — confirm every `<img>` has non-empty `alt`, and pages render even when their collection is empty (no migrated data yet for these three — confirm the "no entries" case doesn't crash: each `.map()` over an empty array just renders nothing, which is already handled).

- [ ] **Step 5: Final `stage.md` update + commit**

Append to `stage.md`'s Log: full feature list shipped, and a "Remaining manual work" section listing everything `scripts/migrate/run.ts`'s report flagged (alt-text placeholders to fill in, Oxygen-only pages to rewrite, Partners/Events/Archive/Downloads content to add via the Orbiter admin at `localhost:4322` using the logo SVGs already in `import-source/uploads/2025/02/` as a starting point for Partners).

```bash
git add -A
git commit -m "feat: Archive/Partners/Downloads listing pages"
```

---

## Self-Review Notes

- **Spec coverage:** every agent.md field (Pages, Events, Blog, Archive, Partners, Downloads) has a matching Zod schema (Task 3), Orbiter collection (Task 4), and route (Task 12/13) except the literal `slug` field, which is intentionally mapped to Orbiter's entry identity instead of a duplicate data field — called out once in Global Constraints rather than re-explained per task.
- **Accessibility mandate:** AAA contrast is enforced by a real test (Task 2), not claimed; keyboard operability comes from using `<button>`/`<a>` natively (Task 11) instead of hand-rolled ARIA widgets; every `<img>` in every route has a required, non-empty `alt` (Tasks 12–13), backed by the migration's alt-text guarantee (Task 8/9).
- **Migration honesty:** pages get *real* extracted content via the Oxygen builder-JSON extractor (Task 6/7), not placeholders — verified against the actual component vocabulary used across the whole legacy site during planning, not assumed. The plan still does not overreach into promising things it genuinely can't deliver automatically: a raw shortcode (e.g. the Kontakt form) can't be statically rendered, the dynamic posts-grid widget is superseded rather than ported, and Events/Archive/Partners have no structured per-entry legacy data to migrate at all (the WP "Veranstaltungen"/"Archiv" pages were intro pages, now migrated into Pages). Every one of these is flagged in the `needsReview` report (Task 9), never silently dropped.
- **No speculative work:** no i18n, no custom repeater field type, no new state-management or testing framework beyond what's installed/native, no general-purpose SQL or HTML parser where a tuple-aware reader and a tree-shaped JSON walker suffice — each of those was considered and explicitly deferred or deliberately scoped with a one-line reason in the relevant task.
