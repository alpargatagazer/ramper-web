/**
 * Specification for generating an Open Graph (OG) image.
 */
export interface OgSpec {
  /** Path to the subject image file, relative to the project root (e.g. 'src/assets/covers/criaturas.webp') */
  subject: string;
  /** Maximum display height in pixels for the subject within the 1200x630 canvas (defaults to 500) */
  height?: number;
  /** Optional texture background filename or path; if omitted, deterministically chosen from key */
  texture?: string;
}

/**
 * Prefix used for keys and filenames of dynamically extracted post OG images (e.g. 'post-slug').
 */
export const POST_OG_PREFIX = 'post-';

/**
 * Static registry of OG image specifications.
 * Maps route or content identifier keys to their source image specifications.
 */
export const OG_SPECS: Record<string, OgSpec> = {
  // Release covers
  '1-el-hoyo': { subject: 'src/assets/covers/hoyo.webp' },
  '2-nuestros-mejores-deseos': { subject: 'src/assets/covers/nmd.webp' },
  '3-sesiones-bravas': { subject: 'src/assets/covers/bravas.webp' },
  '4-solo-postres': { subject: 'src/assets/covers/postres.webp' },
  '5-el-tamborilero': { subject: 'src/assets/covers/tamborilero.webp' },
  '6-la-caja-del-diablo': { subject: 'src/assets/covers/caja.webp' },
  '7-solo-postres-en-teatros-del-canal': { subject: 'src/assets/covers/canal.webp' },
  '8-dos-criaturas': { subject: 'src/assets/covers/criaturas.webp' },

  // Page index & general sections
  home: { subject: 'src/assets/index/cover+vinyl.webp', height: 460 },
  contact: { subject: 'src/assets/textures/animals/cat.webp', height: 460 },
  'music-index': { subject: 'src/assets/index/covers.webp', height: 460 },
  'news-index': { subject: 'src/assets/textures/animals/catlion.webp', height: 460 },
};

/**
 * Returns the public URL path for an OG image given its key.
 *
 * @param key - Identifier for the OG image (e.g. release slug or post key)
 * @returns The absolute web path to the pre-rendered JPEG in public/og/
 */
export function ogPath(key: string): string {
  return `/og/${key}.jpg`;
}

/**
 * Checks whether an OG specification is defined in the static OG_SPECS registry.
 *
 * @param key - The identifier key to check
 * @returns True if a specification exists for the key, false otherwise
 */
export function hasOgSpec(key: string): boolean {
  return Object.hasOwn(OG_SPECS, key);
}

/**
 * Extracts the first image URL from a markdown or Markdoc body string.
 *
 * @param body - The raw markdown or Markdoc text content
 * @returns The URL of the first matched image markdown tag `![alt](url)`, or undefined if none
 */
export function extractFirstImage(body: string): string | undefined {
  const match = /!\[.*?\]\((.+?)\)/.exec(body);
  return match ? match[1] : undefined;
}
