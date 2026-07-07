import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL('sitemap-index.xml', site).href : '';
  const sitemapLine = sitemapUrl ? `\n\nSitemap: ${sitemapUrl}` : '';
  const body = `User-agent: *\nAllow: /${sitemapLine}`;
  return new Response(
    body,
    {
      headers: { 'Content-Type': 'text/plain' }
    }
  );
};
