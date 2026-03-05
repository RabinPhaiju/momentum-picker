// calendar/utils/format.ts — Date formatting utilities

import type { SelectionMode, PickerValue } from "../types";

/** Formats a date using token-based format string. */
export function formatDate(date: Date, format: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const map: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => map[t] ?? t);
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
