// src/utils/dates.ts

function parseLocalDate(date: string | Date): Date {
  if (typeof date === 'string') {
    const parts = date.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  }
  return new Date(date);
}

/**
 * Formats a date string or Date object for display in Spanish locale.
 * e.g. "26 de junio de 2026"
 */
export function formatDate(date: string | Date): string {
  return parseLocalDate(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Extracts the year from a date string or Date object.
 */
export function formatYear(date: string | Date): number {
  return parseLocalDate(date).getFullYear();
}
