// src/utils/og-image.ts
// Build-time OG image generation using Sharp.
// Composites artworks/drawings centered on a zoomed, transparent texture background at 1200×630.

import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const COVER_HEIGHT = 500;

// Resolve against process.cwd() instead of import.meta.url (which resolves to dist/server/.prerender/chunks/ during build)
const PROJECT_ROOT = process.cwd();
const OG_DIR = join(PROJECT_ROOT, 'public/og');
const TEXTURES_DIR = join(PROJECT_ROOT, 'src/assets/textures');

/** Available texture backgrounds for OG images (one is randomly assigned per release) */
const TEXTURE_FILES = ['feathers.webp', 'hair.webp'];

/**
 * Builds the washed-out texture background buffer (zoomed 1.25x with 82% white overlay).
 */
async function createWashedTextureBackground(texturePath: string): Promise<Buffer> {
  const ZOOM = 1.25;
  const textureCrop = await sharp(texturePath)
    .resize(Math.round(OG_WIDTH * ZOOM), Math.round(OG_HEIGHT * ZOOM), { fit: 'cover', position: 'center' })
    .extract({
      left: Math.round((OG_WIDTH * ZOOM - OG_WIDTH) / 2),
      top: Math.round((OG_HEIGHT * ZOOM - OG_HEIGHT) / 2),
      width: OG_WIDTH,
      height: OG_HEIGHT,
    })
    .toBuffer();

  const whiteOverlay = Buffer.from(
    `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}"><rect width="100%" height="100%" fill="white" fill-opacity="0.82" /></svg>`
  );

  return sharp(textureCrop)
    .composite([{ input: whiteOverlay, blend: 'over' }])
    .toBuffer();
}

/**
 * Generates an OG image with an arbitrary subject centered over zoomed, transparent texture.
 */
export async function generateCompositedOg(
  key: string,
  subjectPathRel: string,
  targetHeight: number = 500,
  textureFile: string = 'feathers.webp'
): Promise<string> {
  const outName = `${key}.webp`;
  const outPath = join(OG_DIR, outName);

  if (existsSync(outPath)) {
    return `/og/${outName}`;
  }

  mkdirSync(OG_DIR, { recursive: true });

  const texturePath = join(TEXTURES_DIR, textureFile);
  const subjectPath = join(PROJECT_ROOT, subjectPathRel);
  const bg = await createWashedTextureBackground(texturePath);

  const subject = await sharp(subjectPath)
    .resize({ height: targetHeight, fit: 'inside' })
    .toBuffer();

  const meta = await sharp(subject).metadata();
  const subW = meta.width ?? targetHeight;
  const subH = meta.height ?? targetHeight;

  const left = Math.round((OG_WIDTH - subW) / 2);
  const top = Math.round((OG_HEIGHT - subH) / 2);

  const result = await sharp(bg)
    .composite([{ input: subject, left, top }])
    .webp({ quality: 85 })
    .toBuffer();

  writeFileSync(outPath, result);

  return `/og/${outName}`;
}

/**
 * Generates a 1200×630 OG image: cover centered on texture background.
 * Returns `/og/<slug>.webp`. Cached — skips if file already exists.
 *
 * @param slug - release slug (e.g. "8-dos-criaturas")
 * @param coverFilename - filename in src/assets/covers/ (e.g. "criaturas.webp")
 */
export async function generateReleaseOgImage(
  slug: string,
  coverFilename: string,
): Promise<string> {
  const textureIdx = slug.split('').reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0) % TEXTURE_FILES.length;
  return generateCompositedOg(slug, `src/assets/covers/${coverFilename}`, COVER_HEIGHT, TEXTURE_FILES[textureIdx]);
}

/**
 * Extracts the first image URL from a Markdoc/Markdown body string.
 * Returns `undefined` if no image is found.
 */
export function extractFirstImage(body: string): string | undefined {
  const mdMatch = /!\[.*?\]\((.+?)\)/.exec(body);
  if (mdMatch) return mdMatch[1];
  return undefined;
}
