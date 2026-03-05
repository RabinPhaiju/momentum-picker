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

// ── Default export: MomentumPicker (backwards compat) ─────────────────────────
export { MomentumPicker as default } from "./MomentumPicker";
