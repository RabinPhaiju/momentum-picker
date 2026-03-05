// calendar/types/core.ts — Core type aliases and simple enums

/**
 * How dates are selected.
 */
export type SelectionMode =
  | "single"
  | "range"
  | "multiple"
  | "week"
  | "month"
  | "year"
  | "datetime-seconds";

/** How the picker is presented. */
export type DisplayMode = "inline" | "popover" | "modal";

/** Number of calendar months to render side-by-side (1–6). */
export type NumberOfMonths = 1 | 2 | 3 | 4 | 5 | 6;

/** Current view (drill-down) inside the calendar panel. */
export type ViewMode = "day" | "month" | "year";

/** Theme */
export type DPTheme = "light" | "dark";

/** Where the footer appears relative to the calendar content. */
export type FooterPosition = "top" | "bottom";

/** The raw value type varies by mode. */
export type PickerValue =
  | Date
  | null
  | [Date | null, Date | null]
  | Date[];

/** Info passed to the `renderDay` custom renderer. */
export interface DayRenderInfo {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isDisabled: boolean;
  isOutsideMonth: boolean;
  isWeekend: boolean;
}
