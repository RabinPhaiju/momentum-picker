// calendar/utils/date-compare.ts — Pure date comparison helpers

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

/** True if `date` falls between `start` and `end` (inclusive). */
export function isInRange(date: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  const d = startOfDay(date).getTime();
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  const [lo, hi] = s <= e ? [s, e] : [e, s];
  return d >= lo && d <= hi;
}

/** Returns true if `date` falls before `minDate` or after `maxDate`. */
export function isOutOfRange(date: Date, minDate: Date | null, maxDate: Date | null): boolean {
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
