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
import { DatePicker } from "../src/calendar/DatePicker";
import type { PickerOptions, PickerMode, PickerTheme } from "../src/types";
import type { DatePickerOptions, PickerValue, SelectionMode, DPTheme, DisplayMode } from "../src/calendar/types";

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
      style: style as any,
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
      style: style as any,
      primaryColor,
      is3D,
    });
  }, [theme, style, primaryColor, is3D]);

  // Container is invisible — picker renders its own overlay inside it
  return <div ref={containerRef} aria-hidden="true" />;
};

// ─────────────────────────────────────────────────────────────────────────────

interface DatePickerReactProps
  extends Omit<DatePickerOptions, "container" | "onChange" | "onConfirm" | "onCancel" | "anchor" | "onOpenChange"> {
  /** Controls visibility (controlled component pattern). */
  isOpen?: boolean;
  /** Callback with the selection. */
  onChange?: (value: PickerValue) => void;
  /** Fired when user confirms selection. */
  onConfirm?: (value: PickerValue) => void;
  /** Fired when user cancels selection. */
  onCancel?: () => void;
  /** For popover mode: anchor element selector or ref. */
  anchorRef?: React.RefObject<HTMLElement> | string;
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void;
}

const DatePickerReact: FC<DatePickerReactProps> = ({
  isOpen = false,
  displayMode = "inline",
  mode = "single",
  value,
  theme = "light",
  primaryColor = "#007aff",
  onChange,
  onConfirm,
  onCancel,
  onOpenChange,
  anchorRef,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<DatePicker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const options: DatePickerOptions = {
      ...rest,
      container: containerRef.current,
      displayMode: displayMode as DisplayMode,
      mode: mode as SelectionMode,
      value,
      theme: theme as DPTheme,
      primaryColor,
      onChange,
      onConfirm,
      onCancel,
      onOpenChange,
    };

    if (displayMode === "popover" && anchorRef) {
      if (typeof anchorRef === "string") {
        options.anchor = anchorRef;
      } else if ("current" in anchorRef) {
        options.anchor = anchorRef.current!;
      }
    }

    pickerRef.current = new DatePicker(options);

    return () => {
      pickerRef.current?.destroy();
      pickerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode]);

  useEffect(() => {
    if (!pickerRef.current) return;
    if (isOpen) pickerRef.current.show();
    else pickerRef.current.hide();
  }, [isOpen]);

  useEffect(() => {
    if (!pickerRef.current || value === undefined) return;
    pickerRef.current.setValue(value);
  }, [value]);

  useEffect(() => {
    pickerRef.current?.setOptions({ theme, primaryColor });
  }, [theme, primaryColor]);

  return <div ref={containerRef} aria-hidden="true" />;
};

export { MomentumPickerReact, DatePickerReact };
export default MomentumPickerReact;

// ─────────────────────────────────────────────────────────────────────────────
// Example usage (not part of the wrapper, for illustration only):
// ─────────────────────────────────────────────────────────────────────────────

const ExampleApp: FC = () => {
  const [pickerType, setPickerType] = React.useState<"wheel" | "calendar">("wheel");
  const [open, setOpen] = React.useState(false);
  const [displayMode, setDisplayMode] = React.useState<"modal" | "popover" | "inline">("modal");
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [style, setStyle] = React.useState("default");
  const [is3D, setIs3D] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [calendarValue, setCalendarValue] = React.useState<PickerValue>(new Date());
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleConfirm = useCallback((date: Date, formatted?: string) => {
    setSelectedDate(date);
    setOpen(false);
    console.log("Confirmed:", formatted ?? date);
  }, []);

  const handleCalendarConfirm = useCallback((val: PickerValue) => {
    setCalendarValue(val);
    setOpen(false);
    console.log("Calendar Confirmed:", val);
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

  const activeTabStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "#007aff",
  };

  const inactiveTabStyle: React.CSSProperties = {
    ...buttonStyle,
    background: "transparent",
    color: theme === "dark" ? "#fff" : "#007aff",
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        background: theme === "dark" ? "#000" : "#fff",
        color: theme === "dark" ? "#fff" : "#000",
        minHeight: "100vh",
        transition: "all 0.3s",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px 0" }}>momentum-picker React</h1>
        <p style={{ opacity: 0.6, margin: 0 }}>Premium date & time selection for the modern web.</p>
      </header>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setPickerType("wheel")}
          style={pickerType === "wheel" ? activeTabStyle : inactiveTabStyle}
        >
          🎡 Wheel Picker
        </button>
        <button
          onClick={() => setPickerType("calendar")}
          style={pickerType === "calendar" ? activeTabStyle : inactiveTabStyle}
        >
          📅 Calendar Picker
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 32 }}>
        <section>
          <div style={{ marginBottom: 20 }}>
            <p>Selected Value: <strong>{
              pickerType === "wheel" 
                ? selectedDate.toLocaleString() 
                : Array.isArray(calendarValue) 
                  ? calendarValue.map(d => d?.toLocaleDateString()).join(", ")
                  : (calendarValue as Date)?.toLocaleDateString()
            }</strong></p>
          </div>

          <div>
            {displayMode === "inline" ? (
              <div style={{ border: "1px solid " + (theme === "dark" ? "#333" : "#eee"), borderRadius: 16, padding: 24, background: theme === "dark" ? "#111" : "#fafafa", display: "inline-block" }}>
                {pickerType === "wheel" ? (
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
                ) : (
                  <DatePickerReact
                    isOpen={true}
                    displayMode="inline"
                    mode="range"
                    value={calendarValue}
                    theme={theme}
                    showTimePicker={true}
                    onChange={setCalendarValue}
                  />
                )}
              </div>
            ) : (
              <button
                ref={anchorRef}
                onClick={() => setOpen(true)}
                style={{ ...buttonStyle, padding: "16px 24px", fontSize: 16 }}
              >
                {displayMode === "modal" ? `Open ${pickerType} Modal` : `Open ${pickerType} Popover`}
              </button>
            )}

            {pickerType === "wheel" ? (
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
                anchorRef={displayMode === "popover" ? anchorRef : undefined}
              />
            ) : (
              <DatePickerReact
                isOpen={open}
                displayMode={displayMode}
                mode="single"
                value={calendarValue}
                theme={theme}
                showTimePicker={true}
                onConfirm={handleCalendarConfirm}
                onCancel={handleCancel}
                anchorRef={displayMode === "popover" ? anchorRef : undefined}
              />
            )}
          </div>
        </section>

        <aside style={{ background: theme === "dark" ? "#1c1c1e" : "#f5f5f5", borderRadius: 16, padding: 24 }}>
          <h3 style={{ marginTop: 0 }}>Options</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>DISPLAY MODE</label>
            <select
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as any)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="modal">Modal</option>
              <option value="popover">Popover</option>
              <option value="inline">Inline</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>THEME</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {pickerType === "wheel" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>VISUAL STYLE</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
                >
                  {styles.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={is3D}
                    onChange={(e) => setIs3D(e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  <span style={{ fontSize: 14 }}>Enable 3D Effect</span>
                </label>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export { ExampleApp };

