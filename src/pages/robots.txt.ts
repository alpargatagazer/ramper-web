import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL('sitemap-index.xml', site).href : '';
  const body = `User-agent: *\nAllow: /${sitemapUrl ? `\n\nSitemap: ${sitemapUrl}` : ''}`;
  return new Response(
    body,
    {
      headers: { 'Content-Type': 'text/plain' }
    }
  );
};
