// src/content.config.ts

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 1. News Posts Collection
const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.string(), // Keystatic saves dates as strings
    summary: z.string(),
  }),
});

// 2. Music Releases Collection
const releases = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: 'src/content/releases' }),
  schema: z.object({
    title: z.string(),
    releaseDate: z.string(),
    type: z.enum(['album', 'ep', 'single', 'live', 'demo', 'session']),
    coverImage: z.string().optional(),
    spotifyUrl: z.string().url().optional(),
    bandcampUrl: z.string().url().optional(),
  }),
});

// 3. Singletons (About and Links)
// In Astro 5, Singletons are also collections, but with just one entry
const about = defineCollection({
  loader: glob({ pattern: 'index.mdoc', base: 'src/content/about' }),
  schema: z.object({
    bio: z.string().optional(),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: 'index.mdoc', base: 'src/content/links' }),
  schema: z.object({
    merchUrl: z.string().url(),
    songkickArtistId: z.string().optional(),
  }),
});

// Export the collections so Astro can use them
export const collections = { posts, releases, about, links };
