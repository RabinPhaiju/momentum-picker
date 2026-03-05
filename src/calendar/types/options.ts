// calendar/types/options.ts — DatePickerOptions interface and sub-types

import type { SelectionMode, DisplayMode, ViewMode, DPTheme, FooterPosition, PickerValue, DayRenderInfo } from "./core";

/**
 * A custom footer button definition.
 */
export interface FooterButton {
  label: string;
  onClick: (picker: unknown) => void;
  className?: string;
}

/**
 * A date preset entry shown in the footer preset row.
 * Set `isDivider: true` to render a visual separator.
 */
export interface DatePreset {
  label: string;
  value?: PickerValue | (() => PickerValue);
  isDivider?: boolean;
}

/** Full options accepted by DatePicker constructor. */
export interface DatePickerOptions {
  container?: string | HTMLElement;
  anchor?: string | HTMLElement;
  displayMode?: DisplayMode;
  open?: boolean;
  defaultOpen?: boolean;
  mode?: SelectionMode;
  numberOfMonths?: number;
  value?: PickerValue;
  defaultValue?: PickerValue;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[] | ((date: Date) => boolean);
  disabledRanges?: Array<[Date, Date]>;
  defaultViewDate?: Date;
  weekStartsOn?: 0 | 1 | 6;
  showWeekNumbers?: boolean;
  format?: string;
  locale?: string;
  showToday?: boolean;
  showClear?: boolean;
  showActions?: boolean;
  footerButtons?: FooterButton[];
  presets?: DatePreset[];
  footerPosition?: FooterPosition;
  showTimePicker?: boolean;
  showSeconds?: boolean;
  allowPaste?: boolean;
  theme?: DPTheme;
  primaryColor?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  renderDay?: (date: Date, info: DayRenderInfo) => string | HTMLElement | null;
  renderHeader?: (viewDate: Date, viewMode: ViewMode) => string | HTMLElement | null;
  onChange?: (value: PickerValue, formatted?: string | string[]) => void;
  onConfirm?: (value: PickerValue) => void;
  onCancel?: () => void;
  onValidate?: (date: Date) => string | null;
  onOpenChange?: (open: boolean) => void;
}

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
  footerButtons: FooterButton[] | null;
  presets: DatePreset[] | null;
  footerPosition: FooterPosition;
  showTimePicker: boolean;
  showSeconds: boolean;
  allowPaste: boolean;
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
