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
 *     displayMode="modal"
 *     value={new Date()}
 *     isOpen={open}
 *     theme="dark"
 *     style="material"
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
  extends Omit<PickerOptions, "container" | "onChange" | "onConfirm" | "onCancel" | "anchor"> {
  /** Controls visibility (controlled component pattern). */
  isOpen?: boolean;
  /** Callback with the confirmed Date. */
  onConfirm?: (date: Date, formatted?: string) => void;
  /** Called when user taps Cancel or presses Escape. */
  onCancel?: () => void;
  /** Called when a wheel column changes (inline mode). */
  onChange?: (date: Date, formatted?: string) => void;
  /** For popover mode: anchor element selector or ref. */
  anchorRef?: React.RefObject<HTMLElement> | string;
}

// ─────────────────────────────────────────────────────────────────────────────

const MomentumPickerReact: FC<MomentumPickerReactProps> = ({
  isOpen = false,
  mode = "datetime",
  displayMode = "modal",
  value,
  minDate,
  maxDate,
  minuteStep,
  format,
  locale,
  theme = "light",
  style = "default",
  primaryColor = "#007aff",
  itemHeight = 44,
  visibleRows = 5,
  is3D = true,
  onChange,
  onConfirm,
  onCancel,
  anchorRef,
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
      displayMode: displayMode as any,
      value: value ?? new Date(),
      minDate,
      maxDate,
      minuteStep,
      format,
      locale,
      theme: theme as PickerTheme,
      style,
      primaryColor,
      itemHeight,
      visibleRows,
      is3D,
      onChange,
      onConfirm,
      onCancel,
    };

    // For popover mode, add anchor
    if (displayMode === "popover" && anchorRef) {
      if (typeof anchorRef === "string") {
        options.anchor = anchorRef;
      } else if ("current" in anchorRef) {
        options.anchor = anchorRef.current!;
      }
    }

    pickerRef.current = new MomentumPicker(options);

    return () => {
      // Clean up on unmount
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode]); // recreate if displayMode changes

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

  // ── Sync reactive options ─────────────────────────────────────────────────
  useEffect(() => {
    pickerRef.current?.setOptions({ 
      theme: theme as PickerTheme, 
      style,
      primaryColor,
      is3D,
    });
  }, [theme, style, primaryColor, is3D]);

  // Container is invisible — picker renders its own overlay inside it
  return <div ref={containerRef} aria-hidden="true" />;
};

export default MomentumPickerReact;

// ─────────────────────────────────────────────────────────────────────────────
// Example usage (not part of the wrapper, for illustration only):
// ─────────────────────────────────────────────────────────────────────────────

const ExampleApp: FC = () => {
  const [open, setOpen] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState<"modal" | "popover" | "inline">("modal");
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [style, setStyle] = React.useState("default");
  const [is3D, setIs3D] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleConfirm = useCallback((date: Date, formatted?: string) => {
    setSelectedDate(date);
    setOpen(false);
    console.log("Confirmed:", formatted ?? date);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const styles = [
    "default",
    "material",
    "brutalist",
    "retro",
    "gradient",
    "pastel",
    "neumorphism",
    "vibrant",
  ];

  const buttonStyle: React.CSSProperties = {
    background: "#007aff",
    color: "#fff",
    border: "1px solid #007aff",
    padding: "10px 16px",
    borderRadius: 10,
    fontSize: 14,
    cursor: "pointer",
    marginRight: 8,
    marginBottom: 8,
    fontWeight: 600,
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "sans-serif",
        background: theme === "dark" ? "#000" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        minHeight: "100vh",
        transition: "all 0.3s",
      }}
    >
      <h1>momentum-picker React Demo</h1>
      <p>Selected: <strong>{selectedDate.toLocaleString()}</strong></p>

      <div style={{ marginBottom: 20, padding: 16, background: theme === "dark" ? "#1c1c1e" : "#f5f5f5", borderRadius: 12 }}>
        <h3>Controls</h3>

        <div>
          <label>
            Display Mode:{" "}
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as any)}
              style={{ padding: 8, borderRadius: 6, marginRight: 16 }}
            >
              <option value="modal">Modal</option>
              <option value="popover">Popover</option>
              <option value="inline">Inline</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            Theme:{" "}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              style={{ padding: 8, borderRadius: 6, marginRight: 16 }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            Style:{" "}
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ padding: 8, borderRadius: 6, marginRight: 16 }}
            >
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={is3D}
              onChange={(e) => setIs3D(e.target.checked)}
            />
            {" "}Enable 3D
          </label>
        </div>
      </div>

      <div>
        {displayMode === "inline" ? (
          <div style={{ border: "1px dashed #ccc", borderRadius: 12, padding: 16, marginTop: 16 }}>
            <MomentumPickerReact
              isOpen={true}
              mode="datetime"
              displayMode="inline"
              value={selectedDate}
              format="YYYY-MM-DD HH:mm"
              theme={theme}
              style={style}
              is3D={is3D}
              onConfirm={handleConfirm}
              onChange={handleConfirm}
            />
          </div>
        ) : (
          <button
            ref={anchorRef}
            onClick={() => setOpen(true)}
            style={buttonStyle}
          >
            {displayMode === "modal" ? "📅 Open Modal Picker" : "🎈 Open Popover Picker"}
          </button>
        )}

        <MomentumPickerReact
          isOpen={open}
          mode="datetime"
          displayMode={displayMode}
          value={selectedDate}
          format="YYYY-MM-DD HH:mm"
          theme={theme}
          style={style}
          is3D={is3D}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onChange={(date) => console.log("onChange", date)}
          anchorRef={displayMode === "popover" ? anchorRef : undefined}
        />
      </div>
    </div>
  );
};

export { ExampleApp };

