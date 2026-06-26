// src/utils/dates.ts

/**
 * Formats a date string or Date object for display in Spanish locale.
 * e.g. "26 de junio de 2026"
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Extracts the year from a date string or Date object.
 */
export function formatYear(date: string | Date): number {
  return new Date(date).getFullYear();
}
