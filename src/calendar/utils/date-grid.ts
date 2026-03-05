// calendar/utils/date-grid.ts — Week/grid generators and locale helpers

import { startOfDay, cloneDate } from "./date-compare";

/** Returns the start of the week containing `date`. */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = ((day - weekStartsOn) + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/** Returns the ISO week number (1-53) for a given date. */
export function getISOWeekNumber(date: Date): number {
  const tmp = startOfDay(date);
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7));
  const yearStart = new Date(tmp.getFullYear(), 0, 1);
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Generates the 6-week grid of dates for the calendar view. */
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

/** Returns localised day abbreviations starting from weekStartsOn. */
export function getDayNames(locale: string, weekStartsOn: 0 | 1 | 6 = 0): string[] {
  const baseDays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      new Date(2000, 0, 2 + i),
    ),
  );
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
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2000, month, 1));
}

/** Number of days in a given month (leap-year aware). */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

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
