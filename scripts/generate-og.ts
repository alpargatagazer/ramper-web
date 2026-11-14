/**
 * scripts/generate-og.ts
 *
 * Pre-build script to pre-render all Open Graph (OG) images into public/og/.
 *
 * Running this before `astro build` ensures Astro copies the generated JPEG files
 * into `dist/client/og/` so that static file servers (e.g. Caddy) can serve them directly,
 * avoiding runtime Sharp/SSR overhead or 404s caused by build-time SSR writes.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import {
  OG_SPECS,
  POST_OG_PREFIX,
  extractFirstImage,
  type OgSpec,
} from '../src/utils/og-config.ts';
import { renderOgImage } from '../src/utils/og-image.ts';

const PROJECT_ROOT = process.cwd();
const OG_DIR = join(PROJECT_ROOT, 'public/og');
const POSTS_DIR = join(PROJECT_ROOT, 'src/content/posts');

async function main(): Promise<void> {
  // Ensure the destination output directory exists
  mkdirSync(OG_DIR, { recursive: true });

  // Clone static specifications (releases, home, contact, section indexes)
  const specs: Record<string, OgSpec> = { ...OG_SPECS };

  // Scan all Markdoc posts to automatically extract first image for blog post OG cards
  const postFiles = readdirSync(POSTS_DIR).filter((file) => file.endsWith('.mdoc'));
  for (const file of postFiles) {
    const filePath = join(POSTS_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const image = extractFirstImage(content);

    // Only process local images hosted in /images/ without directory traversal attempts
    if (image && image.startsWith('/images/') && !image.includes('..')) {
      const id = basename(file, extname(file));
      const key = `${POST_OG_PREFIX}${id}`;
      specs[key] = { subject: `public${image}` };
    }
  }

  // Render each specification into a 1200x630 JPEG in public/og/
  for (const [key, spec] of Object.entries(specs)) {
    const buffer = await renderOgImage(key, spec);
    const outPath = join(OG_DIR, `${key}.jpg`);
    writeFileSync(outPath, buffer);
    console.log(`Generated OG image: ${outPath}`);
  }
}

// Exit with non-zero status on error to ensure container builds fail loudly if generation fails
main().catch((err) => {
  console.error('OG image generation failed:', err);
  process.exit(1);
});
