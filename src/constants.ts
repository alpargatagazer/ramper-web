// src/constants.ts
// Shared constants across the application

/**
 * Display labels for release types used across music pages.
 * Keys match the values stored in the Keystatic CMS schema.
 */
export const typeLabels: Record<string, string> = {
  album: 'Álbum',
  single: 'Single',
  ep: 'EP',
  live: 'Directo',
  demo: 'Demo en directo',
  session: 'Sesión en directo',
};

/**
 * Active website theme/era:
 * - 'dos-criaturas': New album style (default)
 * - 'solo-postres': Legacy style (fully preserved)
 */
export const ACTIVE_THEME: 'dos-criaturas' | 'solo-postres' = 'dos-criaturas';
