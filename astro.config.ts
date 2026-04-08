// astro.config.ts
//
// This is the main configuration file for the Astro framework.
// Think of it like a central switchboard: it tells Astro what plugins (integrations)
// to use, how to render pages, and where the site will live.

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import sitemap from '@astrojs/sitemap';

export default defineConfig({

  output: 'static',

  // Used by:
  // - @astrojs/sitemap to generate absolute URLs in sitemap.xml
  // - @astrojs/rss to generate absolute URLs in the RSS feed
  // - SEO meta tags (canonical links, og:url, etc.)
  site: 'https://ramper.band',

  // Integrations extend Astro's capabilities:
  integrations: [
    // React — required by Keystatic (its admin UI is a React app)
    react(),

    // Markdoc — the content format used by Keystatic for rich text
    markdoc(),

    // Keystatic — the CMS integration. Adds routes under /keystatic
    // for the admin UI in development mode
    keystatic(),

    // Sitemap — auto-generates sitemap.xml at build time for SEO
    sitemap(),
  ],

  // Dev server configuration
  server: {
    // Listen on all interfaces so Docker can forward the port
    host: true,
  },

});
