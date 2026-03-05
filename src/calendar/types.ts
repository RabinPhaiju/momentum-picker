/* ─────────────────────────────────────────────────────────────────────────────
   calendar/types.ts — All public TypeScript interfaces for the DatePicker.
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * How dates are selected.
 * - "single"   → one date
 * - "range"    → start + end date (click or drag)
 * - "multiple" → independent multi-selection
 * - "week"     → select an entire ISO week
 * - "month"    → select a month (year+month, day ignored)
 * - "year"     → select a year only
 */
export type SelectionMode = "single" | "range" | "multiple" | "week" | "month" | "year";

/**
 * How the picker is presented.
 * - "inline"  → rendered directly inside a container element
 * - "popover" → floated panel anchored to a trigger element (auto-flips)
 * - "modal"   → centred overlay dialog
 */
export type DisplayMode = "inline" | "popover" | "modal";

/** Number of calendar months to render side-by-side (1–6). */
export type NumberOfMonths = 1 | 2 | 3 | 4 | 5 | 6;

/** Current view (drill-down) inside the calendar panel. */
export type ViewMode = "day" | "month" | "year";

/** Theme */
export type DPTheme = "light" | "dark";

// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

/** The raw value type depends on mode: single → Date | null, range → [Date,Date] | null, multiple → Date[] */
export type PickerValue =
  | Date
  | null                    // single / month / year / week
  | [Date | null, Date | null]   // range
  | Date[];                 // multiple

// ─────────────────────────────────────────────────────────────────────────────

/** Full options accepted by DatePicker constructor. */
export interface DatePickerOptions {
  // ── Mount ──────────────────────────────────────────────────────────────────

  /**
   * Container for "inline" and "modal" display modes.
   * CSS selector or HTMLElement.
   */
  container?: string | HTMLElement;

  /**
   * Trigger / anchor element for "popover" mode.
   * The popover floats relative to this element.
   */
  anchor?: string | HTMLElement;

  /** How the picker is displayed. Defaults to "inline". */
  displayMode?: DisplayMode;

  // ── Open/close state (controlled) ─────────────────────────────────────────

  /** Controlled open state. The component calls onOpenChange when it wants to toggle. */
  open?: boolean;

  /** Default open state for uncontrolled mode. Defaults to false for popover/modal, true for inline. */
  defaultOpen?: boolean;

  // ── Selection ──────────────────────────────────────────────────────────────

  /** Selection mode. Defaults to "single". */
  mode?: SelectionMode;

  /**
   * Number of calendar months to display side by side. Defaults to 1.
   * Best used with mode "range" or "multiple".
   */
  numberOfMonths?: number;

  /** Controlled value. */
  value?: PickerValue;

  /** Initial value for uncontrolled mode. */
  defaultValue?: PickerValue;

  /** Minimum selectable date. Dates before this appear disabled. */
  minDate?: Date;

  /** Maximum selectable date. Dates after this appear disabled. */
  maxDate?: Date;

  /**
   * Specific dates to disable.
   * Either an array of Date objects or a predicate function.
   */
  disabledDates?: Date[] | ((date: Date) => boolean);

  /**
   * Date ranges to disable. Each entry is a [start, end] tuple.
   */
  disabledRanges?: Array<[Date, Date]>;

  // ── View ───────────────────────────────────────────────────────────────────

  /** Which month/year to initially show in the calendar grid. Defaults to today. */
  defaultViewDate?: Date;

  /**
   * First day of the week: 0=Sunday, 1=Monday, 6=Saturday. Defaults to 0.
   * Use 0 to start with Sunday, 1 to start with Monday.
   */
  weekStartsOn?: 0 | 1 | 6;

  /** Show ISO week numbers in the leftmost column. Defaults to false. */
  showWeekNumbers?: boolean;

  // ── Formatting ─────────────────────────────────────────────────────────────

  /**
   * Output format string. Tokens: YYYY MM DD HH mm
   * @example "YYYY-MM-DD" | "DD/MM/YYYY"
   */
  format?: string;

  /** BCP 47 locale for month/day names. Defaults to navigator.language. */
  locale?: string;

  // ── Buttons ────────────────────────────────────────────────────────────────

  /** Show a "Today" button in the footer. Defaults to true. */
  showToday?: boolean;

  /** Show a "Clear" button in the footer. Defaults to false. */
  showClear?: boolean;

  /** Show Cancel/Confirm action buttons (modal/popover). Defaults to true. */
  showActions?: boolean;

  // ── Appearance ─────────────────────────────────────────────────────────────

  /** Visual theme. Defaults to "light". */
  theme?: DPTheme;

  /** Accent / primary color. Overrides --dp-primary CSS variable. */
  primaryColor?: string;

  /** Additional CSS class name(s) added to the root element. */
  className?: string;

  /** Inline style overrides for the root element. */
  style?: Partial<CSSStyleDeclaration>;

  // ── Custom Renderers ───────────────────────────────────────────────────────

  /**
   * Custom renderer for individual day cells.
   * Return an HTML string, an HTMLElement, or null to use default rendering.
   */
  renderDay?: (date: Date, info: DayRenderInfo) => string | HTMLElement | null;

  /**
   * Custom renderer for the calendar header (month+year nav area).
   * Return an HTML string, an HTMLElement, or null to use default rendering.
   */
  renderHeader?: (viewDate: Date, viewMode: ViewMode) => string | HTMLElement | null;

  // ── Callbacks ──────────────────────────────────────────────────────────────

  /**
   * Fires whenever the selection changes.
   * For range mode: fires on every hover (with partial range) and click.
   */
  onChange?: (value: PickerValue, formatted?: string | string[]) => void;

  /** Fires when user confirms selection (Confirm button / Enter). */
  onConfirm?: (value: PickerValue) => void;

  /** Fires on Cancel button or Escape key. */
  onCancel?: () => void;

  /**
   * Validation hook. Return an error message string if date is invalid,
   * or null if valid. Invalid dates show a tooltip but are not disabled by default.
   */
  onValidate?: (date: Date) => string | null;

  /** Fires when open/close state changes. */
  onOpenChange?: (open: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Resolved/normalised options (all optionals filled with defaults). */
export interface ResolvedDPOptions {
  displayMode: DisplayMode;
  mode: SelectionMode;
  numberOfMonths: number;
  value: PickerValue;
  open: boolean;
  minDate: Date | null;
  maxDate: Date | null;
  disabledDates: Date[] | ((d: Date) => boolean) | null;
  disabledRanges: Array<[Date, Date]> | null;
  defaultViewDate: Date;
  weekStartsOn: 0 | 1 | 6;
  showWeekNumbers: boolean;
  format: string | null;
  locale: string;
  showToday: boolean;
  showClear: boolean;
  showActions: boolean;
  theme: DPTheme;
  primaryColor: string;
  className: string;
  renderDay: DatePickerOptions["renderDay"];
  renderHeader: DatePickerOptions["renderHeader"];
  onChange: DatePickerOptions["onChange"];
  onConfirm: DatePickerOptions["onConfirm"];
  onCancel: DatePickerOptions["onCancel"];
  onValidate: DatePickerOptions["onValidate"];
  onOpenChange: DatePickerOptions["onOpenChange"];
}
