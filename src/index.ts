// ─────────────────────────────────────────────────────────────────────────────
// index.ts — Public entry point for momentum-picker.
//
// Exports:
//   MomentumPicker  → iOS-style wheel datetime picker
//   DatePicker      → Full-featured calendar date picker
// ─────────────────────────────────────────────────────────────────────────────

// ── Wheel Picker ──────────────────────────────────────────────────────────────
export { MomentumPicker } from "./MomentumPicker";
export { WheelColumn } from "./WheelColumn";

export type {
  PickerOptions,
  PickerMode,
  PickerTheme,
  ColumnDef,
  ColumnItem,
  ResolvedOptions,
} from "./types";

// ── Calendar DatePicker ───────────────────────────────────────────────────────
export { DatePicker } from "./calendar/DatePicker";

export type {
  DatePickerOptions,
  SelectionMode,
  DisplayMode,
  ViewMode,
  DPTheme,
  DayRenderInfo,
  PickerValue,
  ResolvedDPOptions,
} from "./calendar/types";

// ── React Wrapper ─────────────────────────────────────────────────────────────
export { ReactMomentumPicker, ReactDatePicker } from "./react-wrapper";
export type { ReactMomentumPickerProps, ReactDatePickerProps } from "./react-wrapper";

// ── Default export: MomentumPicker (backwards compat) ─────────────────────────
export { MomentumPicker as default } from "./MomentumPicker";
