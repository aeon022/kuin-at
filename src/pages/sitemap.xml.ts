// sitemap.xml.ts — hand-rolled instead of @astrojs/sitemap: that integration
// discovers routes from the static build output, but this whole site is
// `output: 'server'` (mandatory for live Orbiter reads — see astro.config.mjs)
// with no prerendered pages, so it would only ever find the handful of
// static asset routes and silently ship a near-empty sitemap. Querying the
// same Orbiter collections CommandPalette.astro already assembles into its
// search index — same static-routes + pages/blog/events pattern — produces
// a genuinely complete one instead.
import type { APIRoute } from 'astro';
import { getCollection } from 'orbiter:collections';

const staticRoutes = [
  '/',
  '/aktuell',
  '/archiv',
  '/partner',
  '/der-verein',
  '/der-verein/vorstand',
  '/der-verein/team',
  '/kontakt',
  '/blog',
  '/events',
  '/downloads',
];

export const GET: APIRoute = async ({ site }) => {
  const pages = (await getCollection('pages')).map((p) => `/${p.slug}`);
  const posts = (await getCollection('blog')).map((p) => `/blog/${p.slug}`);
  const events = (await getCollection('events')).map((e) => `/events/${e.slug}`);
  const archive = (await getCollection('archive')).map((a) => `/archiv/${a.slug}`);

  // Same de-dup reasoning as CommandPalette.astro's own `pages` filter: a
  // CMS `pages` entry can share a route with one of the hand-built static
  // routes above (e.g. a "kontakt" page entry) — the static one wins.
  const routes = [
    ...staticRoutes,
    ...pages.filter((href) => !staticRoutes.includes(href)),
    ...posts,
    ...events,
    ...archive,
  ];

  const base = site?.toString().replace(/\/$/, '') ?? '';
  const urls = routes
    .map((path) => `  <url><loc>${base}${path}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
