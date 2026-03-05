// ─────────────────────────────────────────────────────────────────────────────
// utils.ts — Pure utility functions for date math, formatting, and helpers.
// All functions are stateless and tree-shakeable.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the number of days in a given month, correctly handling leap years.
 * @param year  Full 4-digit year, e.g. 2024
 * @param month 0-based month index (0 = January … 11 = December)
 */
export function getDaysInMonth(year: number, month: number): number {
  // Day 0 of the NEXT month == last day of the current month
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generates an inclusive numeric range array.
 * @param start First value (inclusive)
 * @param end   Last value (inclusive)
 * @param step  Increment per step. Defaults to 1.
 * @example generateRange(0, 59, 5) → [0, 5, 10, …, 55]
 */
export function generateRange(
  start: number,
  end: number,
  step = 1,
): number[] {
  const result: number[] = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Zero-pads a single-digit number to two characters.
 * @example padZero(7) → "07"
 */
export function padZero(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Clamps a numeric value to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Returns the index of the nearest multiple of `step` to `value`.
 * Useful for snapping minutes to a step interval.
 */
export function snapToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Returns localised short month names for a given locale using the
 * Intl.DateTimeFormat API (guaranteed in all modern browsers).
 * @param locale BCP 47 locale, e.g. "en-US", "fr-FR", "ja-JP"
 * @returns Array of 12 month name strings (January … December)
 */
export function getMonthNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    return new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(2000, i, 1),
    );
  });
}

/**
 * Formats a Date using a simple token-based format string.
 *
 * Supported tokens:
 *  YYYY – 4-digit year
 *  MM   – 2-digit month (01-12)
 *  DD   – 2-digit day (01-31)
 *  HH   – 2-digit hour 24h (00-23)
 *  mm   – 2-digit minute (00-59)
 *
 * @param date   Source date
 * @param format Format string, e.g. "YYYY-MM-DD HH:mm"
 * @param locale BCP 47 locale (currently not used for format, reserved for future l10n)
 */
export function formatDate(
  date: Date,
  format: string,
  _locale?: string,
): string {
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: padZero(date.getMonth() + 1),
    DD: padZero(date.getDate()),
    HH: padZero(date.getHours()),
    mm: padZero(date.getMinutes()),
  };
  return format.replace(/YYYY|MM|DD|HH|mm/g, (token) => map[token] ?? token);
}

/**
 * Determines whether two dates refer to the same calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Deep-clones a Date object.
 */
export function cloneDate(d: Date): Date {
  return new Date(d.getTime());
}

/**
 * Linear interpolation helper for smooth animation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
