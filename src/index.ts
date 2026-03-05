// ─────────────────────────────────────────────────────────────────────────────
// index.ts — Public entry point for momentum-picker.
//
// Consumers import from this file:
//   import MomentumPicker from 'momentum-picker';
//   import { MomentumPicker, type PickerOptions } from 'momentum-picker';
// ─────────────────────────────────────────────────────────────────────────────

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

// Default export for convenience
export { MomentumPicker as default } from "./MomentumPicker";
