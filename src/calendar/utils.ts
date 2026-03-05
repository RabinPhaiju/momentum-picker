// ─────────────────────────────────────────────────────────────────────────────
// calendar/utils.ts — Calendar-specific utility functions.
// All functions are pure and stateless.
// ─────────────────────────────────────────────────────────────────────────────

import type { SelectionMode, PickerValue } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Date Comparison Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Strip time from a date — returns a new Date set to midnight. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Returns true if two dates fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns true if two dates are in the same month+year. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Returns true if two dates are in the same year. */
export function isSameYear(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear();
}

/** Returns true if `d` is strictly before `other` (day precision). */
export function isBefore(d: Date, other: Date): boolean {
  return startOfDay(d) < startOfDay(other);
}

/** Returns true if `d` is strictly after `other` (day precision). */
export function isAfter(d: Date, other: Date): boolean {
  return startOfDay(d) > startOfDay(other);
}

/** Returns true if `d` is today. */
export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

/** Returns true if `d` is a weekend (Sat=6 or Sun=0). */
export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/** Deep-clones a Date. */
export function cloneDate(d: Date): Date {
  return new Date(d.getTime());
}

// ─────────────────────────────────────────────────────────────────────────────
// Week / Grid Generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the first day (Monday) of the ISO week containing `date`.
 * ISO 8601: week starts on Monday, week 1 contains the year's first Thursday.
 * @param weekStartsOn 0=Sun,1=Mon,6=Sat
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  // Compute how many days to subtract to reach weekStart
  const diff = ((day - weekStartsOn) + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Returns the ISO week number (1-53) for a given date. */
export function getISOWeekNumber(date: Date): number {
  const tmp = startOfDay(date);
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1...Sun=7)
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Generates the 6-week grid of dates for the calendar view.
 * Returns an array of 42 dates (6 rows × 7 cols), starting from the
 * first day of the display week, which may include days from the
 * previous and next months.
 */
export function generateCalendarGrid(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 | 6 = 0,
): Date[][] {
  const firstDay = new Date(year, month, 1);
  const gridStart = startOfWeek(firstDay, weekStartsOn);
  const weeks: Date[][] = [];

  let current = cloneDate(gridStart);
  for (let week = 0; week < 6; week++) {
    const row: Date[] = [];
    for (let day = 0; day < 7; day++) {
      row.push(cloneDate(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Disabled Date Checks
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true if `date` falls before `minDate` or after `maxDate`. */
export function isOutOfRange(
  date: Date,
  minDate: Date | null,
  maxDate: Date | null,
): boolean {
  if (minDate && isBefore(date, minDate)) return true;
  if (maxDate && isAfter(date, maxDate)) return true;
  return false;
}

/** Checks all disabled rule sources. Returns true if date should be disabled. */
export function isDateDisabled(
  date: Date,
  minDate: Date | null,
  maxDate: Date | null,
  disabledDates: Date[] | ((d: Date) => boolean) | null,
  disabledRanges: Array<[Date, Date]> | null,
): boolean {
  if (isOutOfRange(date, minDate, maxDate)) return true;

  if (disabledDates) {
    if (typeof disabledDates === "function") {
      if (disabledDates(date)) return true;
    } else {
      if (disabledDates.some((d) => isSameDay(d, date))) return true;
    }
  }

  if (disabledRanges) {
    for (const [start, end] of disabledRanges) {
      const d = startOfDay(date);
      if (d >= startOfDay(start) && d <= startOfDay(end)) return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Range / Selection Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** True if `date` falls between `start` and `end` (inclusive). */
export function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const d = startOfDay(date).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  const [lo, hi] = s <= e ? [s, e] : [e, s];
  return d >= lo && d <= hi;
}

// ─────────────────────────────────────────────────────────────────────────────
// Locale Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns localised day abbreviations (2-3 chars) starting from weekStartsOn. */
export function getDayNames(
  locale: string,
  weekStartsOn: 0 | 1 | 6 = 0,
): string[] {
  // Generate 7 day names starting from Sunday
  const baseDays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(2000, 0, 2 + i), // Jan 2 2000 = Sunday
    ),
  );
  // Rotate so weekStartsOn is first
  return [...baseDays.slice(weekStartsOn), ...baseDays.slice(0, weekStartsOn)];
}

/** Returns localised month names (full) for a locale. */
export function getMonthNames(locale: string): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, i, 1)),
  );
}

/** Returns localised short month name for a given month index. */
export function getShortMonthName(month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(2000, month, 1),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Format Helper
// ─────────────────────────────────────────────────────────────────────────────

/** Formats a date using token-based format string. */
export function formatDate(date: Date, format: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
  };
  return format.replace(/YYYY|MM|DD|HH|mm/g, (t) => map[t] ?? t);
}

/** Format a PickerValue to a string or array of strings. */
export function formatValue(
  value: PickerValue,
  format: string | null,
  mode: SelectionMode,
): string | string[] | undefined {
  if (!format) return undefined;
  if (!value) return undefined;

  if (mode === "range" && Array.isArray(value) && value.length === 2) {
    const [s, e] = value as [Date | null, Date | null];
    return [
      s ? formatDate(s, format) : "",
      e ? formatDate(e, format) : "",
    ];
  }
  if (mode === "multiple" && Array.isArray(value)) {
    return (value as Date[]).map((d) => formatDate(d, format));
  }
  if (value instanceof Date) return formatDate(value, format);
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the first date of the previous month. */
export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

/** Returns the first date of the next month. */
export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

/** Number of days in a given month (leap-year aware). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
