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
 * How the picker is presented.
 * - "inline"  → rendered directly inside a container element
 * - "popover" → floated panel anchored to a trigger element
 * - "modal"   → centred overlay dialog
 */
export type DisplayMode = "inline" | "popover" | "modal";

/**
 * Visual color theme of the picker.
 */
export type PickerTheme = "light" | "dark";

/**
 * Visual style variation of the picker.
 */
export type PickerStyle =
  | "default"
  | "neumorphism"
  | "brutalist"
  | "retro"
  | "gradient"
  | "pastel"
  | "vibrant"
  | "frosted"
  | "elevated"
  | "material"
  | "ios"
  | "macos"
  | "bootstrap"
  | "tailwind"
  | "chakra"
  | "ant";

/**
 * Full options accepted by MomentumPicker constructor.
 */
export interface PickerOptions {
  /**
   * CSS selector string or an HTMLElement to mount the picker into.
   * Required for "inline" and "modal" modes.
   * @example "#app" | document.getElementById("app")
   */
  container?: string | HTMLElement;

  /**
   * Trigger / anchor element for "popover" mode.
   * The popover floats relative to this element.
   */
  anchor?: string | HTMLElement;

  /**
   * How the picker is presented. Defaults to "modal".
   */
  displayMode?: DisplayMode;

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
   * Style variation. Defaults to "default".
   * - "default": Standard iOS look
   * - "glass": Glassmorphism effect
   * - "modern": Vibrant accents and rounded pills
   * - "black": True black for OLED
   */
  style?: PickerStyle;

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

  /**
   * Width of the picker (e.g. "320px", "100%"). Useful to constrain popover width.
   * Defaults to "100%" (but capped by max-width in CSS).
   */
  width?: string;

  /**
   * Whether to enable the 3D cylindrical wheel effect. Defaults to true.
   */
  is3D?: boolean;

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
  displayMode: DisplayMode;
  mode: PickerMode;
  value: Date;
  minDate: Date | null;
  maxDate: Date | null;
  minuteStep: number;
  format: string | null;
  locale: string;
  theme: PickerTheme;
  style: PickerStyle;
  primaryColor: string;
  itemHeight: number;
  visibleRows: number;
  width: string;
  is3D: boolean;
  onChange?: PickerOptions["onChange"];
  onConfirm?: PickerOptions["onConfirm"];
  onCancel?: PickerOptions["onCancel"];
}
