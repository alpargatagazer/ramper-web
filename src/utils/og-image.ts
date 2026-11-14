import sharp from 'sharp';
import { join } from 'node:path';
import type { OgSpec } from './og-config.ts';

/** Standard Open Graph canvas dimensions */
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Default pool of texture backgrounds randomly/deterministically assigned */
const TEXTURE_FILES = ['feathers.webp', 'hair.webp'];

/** Base directory for resolving relative asset paths */
const PROJECT_ROOT = process.cwd();

/** In-memory cache for pre-rendered washed-out texture background buffers */
const textureCache = new Map<string, Promise<Buffer>>();

/**
 * Deterministically selects a texture from the default pool based on the key's character codes.
 *
 * @param key - Identifier key (e.g. release slug or post key)
 * @returns Filename of the selected texture
 */
function pickTexture(key: string): string {
  const sum = key.split('').reduce((acc, c) => acc + (c.codePointAt(0) ?? 0), 0);
  return TEXTURE_FILES[sum % TEXTURE_FILES.length];
}

/**
 * Creates and memoizes a washed-out texture background:
 * 1. Zooms the source texture by 1.25x and crops it centered to 1200x630.
 * 2. Blends a solid white overlay with 82% opacity over the cropped texture.
 *
 * @param texturePath - Absolute path to the source texture image
 * @returns Promise resolving to the composited background image buffer
 */
async function getWashedTextureBackground(texturePath: string): Promise<Buffer> {
  const cached = textureCache.get(texturePath);
  if (cached) return cached;

  const promise = (async () => {
    const ZOOM = 1.25;

    // Zoom and center-crop the texture to 1200x630
    const textureCrop = await sharp(texturePath)
      .resize(Math.round(OG_WIDTH * ZOOM), Math.round(OG_HEIGHT * ZOOM), {
        fit: 'cover',
        position: 'center',
      })
      .extract({
        left: Math.round((OG_WIDTH * ZOOM - OG_WIDTH) / 2),
        top: Math.round((OG_HEIGHT * ZOOM - OG_HEIGHT) / 2),
        width: OG_WIDTH,
        height: OG_HEIGHT,
      })
      .toBuffer();

    // Generate an RGBA white overlay with 82% opacity (alpha 0.82)
    const whiteOverlay = await sharp({
      create: {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0.82 },
      },
    })
      .png()
      .toBuffer();

    // Composite overlay on top of the texture
    return sharp(textureCrop)
      .composite([{ input: whiteOverlay, blend: 'over' }])
      .toBuffer();
  })();

  textureCache.set(texturePath, promise);
  return promise;
}

/**
 * Renders an Open Graph JPEG image buffer (1200x630, quality 85, mozjpeg)
 * by centering a constrained subject on a washed-out texture background.
 *
 * @param key - Unique key for deterministic texture selection if none specified
 * @param spec - Subject image path, optional target height, and optional texture
 * @returns Promise resolving to the final JPEG Buffer
 */
export async function renderOgImage(key: string, spec: OgSpec): Promise<Buffer> {
  // Resolve texture path (deterministic fallback if spec.texture is omitted)
  const textureFile = spec.texture ?? pickTexture(key);
  const texturePath = textureFile.includes('/')
    ? join(PROJECT_ROOT, textureFile)
    : join(PROJECT_ROOT, 'src/assets/textures', textureFile);

  const bg = await getWashedTextureBackground(texturePath);

  // Constrain subject dimensions inside bounds (width: 1100, height: spec.height or 500)
  const subjectPath = join(PROJECT_ROOT, spec.subject);
  const targetWidth = OG_WIDTH - 100;
  const targetHeight = spec.height ?? 500;

  const subject = await sharp(subjectPath)
    .resize({ width: targetWidth, height: targetHeight, fit: 'inside' })
    .toBuffer();

  // Calculate centered placement coordinates
  const meta = await sharp(subject).metadata();
  const subW = meta.width ?? targetWidth;
  const subH = meta.height ?? targetHeight;

  const left = Math.round((OG_WIDTH - subW) / 2);
  const top = Math.round((OG_HEIGHT - subH) / 2);

  // Composite subject over the background and encode as optimized JPEG
  return sharp(bg)
    .composite([{ input: subject, left, top }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}
