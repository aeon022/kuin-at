import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import orbiter from '@a83/orbiter-integration';
import node from '@astrojs/node';

export default defineConfig({
  // Production domain, not wherever a given build happens to be served
  // from (e.g. preview.kuin.at) — canonical URLs, sitemap.xml, and OG
  // `og:url` should all point at the real kuin.at even from a preview
  // deploy, same reasoning as any other staging environment.
  site: 'https://kuin.at',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { plugins: [tailwindcss()] },
  // Server build points this at api.kuin.at's content.pod directly (shared
  // Orbiter DB, admin UI writes there) via ORBITER_POD env at build time —
  // local dev falls back to its own ./content.pod.
  integrations: [orbiter({ pod: process.env.ORBITER_POD || './content.pod' })],
});
