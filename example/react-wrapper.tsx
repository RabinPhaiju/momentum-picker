/**
 * react-wrapper.tsx
 *
 * A React wrapper component for momentum-picker.
 * Uses a ref to mount/destroy the vanilla MomentumPicker class.
 *
 * Usage:
 *   import MomentumPickerReact from './react-wrapper';
 *
 *   <MomentumPickerReact
 *     mode="datetime"
 *     value={new Date()}
 *     isOpen={open}
 *     onConfirm={(date) => console.log(date)}
 *     onCancel={() => setOpen(false)}
 *   />
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  type FC,
} from "react";
import MomentumPicker from "../src/index"; // adjust to 'momentum-picker' after npm install
import type { PickerOptions, PickerMode, PickerTheme } from "../src/types";

// ─────────────────────────────────────────────────────────────────────────────

interface MomentumPickerReactProps
  extends Omit<PickerOptions, "container" | "onChange" | "onConfirm" | "onCancel"> {
  /** Controls visibility (controlled component pattern). */
  isOpen?: boolean;
  /** Callback with the confirmed Date. */
  onConfirm?: (date: Date, formatted?: string) => void;
  /** Called when user taps Cancel or presses Escape. */
  onCancel?: () => void;
  /** Called whenever a wheel column changes. */
  onChange?: (date: Date, formatted?: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

const MomentumPickerReact: FC<MomentumPickerReactProps> = ({
  isOpen = false,
  mode = "datetime",
  value,
  minDate,
  maxDate,
  minuteStep,
  format,
  locale,
  theme,
  primaryColor,
  itemHeight,
  visibleRows,
  onChange,
  onConfirm,
  onCancel,
}) => {
  // A hidden div that acts as the container for the vanilla picker
  const containerRef = useRef<HTMLDivElement>(null);
  // Store the picker instance across renders
  const pickerRef = useRef<MomentumPicker | null>(null);

  /**
   * Initialise the picker once after first mount.
   * The container div is appended to document.body so the overlay
   * can cover the full viewport correctly.
   */
  useEffect(() => {
    if (!containerRef.current) return;

    const options: PickerOptions = {
      container: containerRef.current,
      mode: mode as PickerMode,
      value: value ?? new Date(),
      minDate,
      maxDate,
      minuteStep,
      format,
      locale,
      theme: theme as PickerTheme,
      primaryColor,
      itemHeight,
      visibleRows,
      onChange,
      onConfirm,
      onCancel,
    };

    pickerRef.current = new MomentumPicker(options);

    return () => {
      // Clean up on unmount
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — initialise once

  // ── Sync isOpen prop → show/hide ──────────────────────────────────────────
  useEffect(() => {
    if (!pickerRef.current) return;
    if (isOpen) {
      pickerRef.current.show();
    } else {
      pickerRef.current.hide();
    }
  }, [isOpen]);

  // ── Sync value prop → setValue ────────────────────────────────────────────
  useEffect(() => {
    if (!pickerRef.current || !value) return;
    pickerRef.current.setValue(value);
  }, [value]);

  // ── Sync theme / primaryColor changes ─────────────────────────────────────
  useEffect(() => {
    pickerRef.current?.setOptions({ theme: theme as PickerTheme, primaryColor });
  }, [theme, primaryColor]);

  // Container is invisible — picker renders its own overlay inside it
  return <div ref={containerRef} aria-hidden="true" />;
};

export default MomentumPickerReact;

// ─────────────────────────────────────────────────────────────────────────────
// Example usage (not part of the wrapper, for illustration only):
// ─────────────────────────────────────────────────────────────────────────────

const ExampleApp: FC = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

  const handleConfirm = useCallback((date: Date) => {
    setSelectedDate(date);
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>momentum-picker React Demo</h1>
      <p>Selected: {selectedDate.toLocaleString()}</p>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: "#007aff",
          color: "#fff",
          border: "none",
          padding: "12px 24px",
          borderRadius: 12,
          fontSize: 16,
          cursor: "pointer",
          marginTop: 16,
        }}
      >
        Open Picker
      </button>

      <MomentumPickerReact
        isOpen={open}
        mode="datetime"
        value={selectedDate}
        format="YYYY-MM-DD HH:mm"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onChange={(date) => console.log("onChange", date)}
      />
    </div>
  );
};

export { ExampleApp };
