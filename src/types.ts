// ─────────────────────────────────────────────────────────────────────────────
// types.ts — All public TypeScript interfaces and type definitions
// for the momentum-picker library.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The display mode of the picker.
 * - "date"     → year / month / day columns
 * - "time"     → hour / minute columns
 * - "datetime" → year / month / day / hour / minute columns
 */
export type PickerMode = "date" | "time" | "datetime";

/**
 * Visual theme of the picker.
 */
export type PickerTheme = "light" | "dark";

/**
 * Full options accepted by MomentumPicker constructor.
 */
export interface PickerOptions {
  /**
   * CSS selector string or an HTMLElement to mount the picker into.
   * @example "#app" | document.getElementById("app")
   */
  container: string | HTMLElement;

  /**
   * Picker mode. Defaults to "datetime".
   */
  mode?: PickerMode;

  /**
   * Initial date/time value. Defaults to now.
   */
  value?: Date;

  /**
   * Minimum selectable date. No lower bound if omitted.
   */
  minDate?: Date;

  /**
   * Maximum selectable date. No upper bound if omitted.
   */
  maxDate?: Date;

  /**
   * Step for minutes column. Defaults to 1.
   * @example 5 → shows 0, 5, 10, …
   */
  minuteStep?: number;

  /**
   * Output format string passed to onChange / getValue.
   * Uses simple tokens: YYYY MM DD HH mm.
   * If omitted the raw Date object is used and format is ignored.
   */
  format?: string;

  /**
   * BCP 47 locale string for localising month names.
   * @example "en-US" | "fr-FR" | "ja-JP"
   */
  locale?: string;

  // ── Appearance ────────────────────────────────────────────────────────────

  /** "light" | "dark". Defaults to "light". */
  theme?: PickerTheme;

  /**
   * Primary accent color (used for confirm button and selection indicator).
   * Any valid CSS color string. Defaults to iOS blue "#007aff".
   */
  primaryColor?: string;

  /**
   * Height of each item row in pixels. Defaults to 44.
   */
  itemHeight?: number;

  /**
   * How many rows are visible in the picker window. Must be odd. Defaults to 5.
   */
  visibleRows?: number;

  // ── Event callbacks ───────────────────────────────────────────────────────

  /**
   * Fired every time a wheel column snaps to a new value.
   * @param date The currently selected Date.
   * @param formatted Formatted string if `format` was provided, otherwise undefined.
   */
  onChange?: (date: Date, formatted?: string) => void;

  /**
   * Fired when the user taps/clicks the "Confirm" / "Done" button.
   * @param date The confirmed Date.
   * @param formatted Formatted string if `format` was provided, otherwise undefined.
   */
  onConfirm?: (date: Date, formatted?: string) => void;

  /**
   * Fired when the user taps/clicks the "Cancel" button.
   */
  onCancel?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single item inside a WheelColumn.
 */
export interface ColumnItem {
  /** Display label shown in the wheel. */
  label: string;
  /** Underlying numeric value (year, month-index, day, hour, minute). */
  value: number;
}

/**
 * Definition of a single wheel column passed from MomentumPicker → WheelColumn.
 */
export interface ColumnDef {
  /** Unique column key used for ARIA labelling and internal identification. */
  key: "year" | "month" | "day" | "hour" | "minute";
  /** ARIA label announced to screen readers. */
  ariaLabel: string;
  /** Ordered list of items for this column. */
  items: ColumnItem[];
  /** Index of the initially selected item inside `items`. */
  selectedIndex: number;
  /** Called whenever the selected index changes. */
  onSelect: (index: number) => void;
}

/**
 * Resolved, normalised picker configuration (all optionals filled with defaults).
 */
export interface ResolvedOptions {
  mode: PickerMode;
  value: Date;
  minDate: Date | null;
  maxDate: Date | null;
  minuteStep: number;
  format: string | null;
  locale: string;
  theme: PickerTheme;
  primaryColor: string;
  itemHeight: number;
  visibleRows: number;
  onChange?: PickerOptions["onChange"];
  onConfirm?: PickerOptions["onConfirm"];
  onCancel?: PickerOptions["onCancel"];
}
