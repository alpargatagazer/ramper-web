import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).href;
  return new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}`,
    {
      headers: { 'Content-Type': 'text/plain' }
    }
  );
};
