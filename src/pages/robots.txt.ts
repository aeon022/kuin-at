// robots.txt as an endpoint: the same code runs on preview.kuin.at and (later) kuin.at.
// Preview is a staging copy and must stay out of search indexes; production allows everything.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ url }) => {
  const body = url.hostname.startsWith('preview.')
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\n\nSitemap: https://kuin.at/sitemap.xml\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
