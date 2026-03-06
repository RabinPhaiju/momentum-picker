import React, { useEffect, useRef, useMemo } from "react";
import { MomentumPicker, PickerOptions } from "./index";
import { DatePicker, DatePickerOptions, PickerValue } from "./index";
import { formatDate } from "./utils";

// Import styles to ensure they are available in the React app
import "./styles/wheel.css";
import "./styles/calendar.css";

export interface ReactMomentumPickerProps extends Omit<PickerOptions, "container" | "open"> {
  open?: boolean;
  onConfirm?: (date: Date, formatted?: string) => void;
  onChange?: (date: Date, formatted?: string) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
}

/**
 * React wrapper for the MomentumPicker (iOS-style wheel picker).
 */
export const ReactMomentumPicker: React.FC<ReactMomentumPickerProps> = ({ children, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerInstance = useRef<MomentumPicker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isInline = props.displayMode === "inline" || !props.displayMode;
    // Use the container as the anchor if in popover mode and no custom anchor is provided
    const anchor = props.anchor || (props.displayMode === "popover" ? containerRef.current : undefined);
    
    // For non-inline modes, we typically want to mount to body to avoid stacking context issues
    const container = isInline ? containerRef.current : document.body;

    const picker = new MomentumPicker({
      ...props,
      container,
      anchor,
      displayMode: props.displayMode || "inline",
    });

    pickerInstance.current = picker;

    return () => {
      picker.destroy();
      pickerInstance.current = null;
    };
  }, []);

  // Use props.value to formatted string for the default input
  const displayValue = useMemo(() => {
    if (!(props.value instanceof Date)) return "";
    const fmt = props.format || (props.mode === "datetime" ? "YYYY-MM-DD HH:mm" : props.mode === "time" ? "HH:mm" : "YYYY-MM-DD");
    return formatDate(props.value, fmt, props.locale);
  }, [props.value, props.format, props.mode, props.locale]);

  useEffect(() => {
    if (pickerInstance.current && props.open !== undefined) {
      if (props.open) pickerInstance.current.show();
      else pickerInstance.current.hide();
    }
  }, [props.open]);

  useEffect(() => {
    if (pickerInstance.current) {
      pickerInstance.current.setOptions(props);
      if (props.value) pickerInstance.current.setValue(props.value);
    }
  }, [props]);

  const isInline = props.displayMode === "inline" || !props.displayMode;

  return (
    <div 
      ref={containerRef} 
      className="momentum-picker-react-wrapper"
      onClick={(e) => {
        // Stop bubbling so the document 'outside click' doesn't catch it immediately
        e.stopPropagation();
        if (!isInline) 
          pickerInstance.current?.toggle();
      }}
      style={{ display: isInline ? "block" : "inline-block", width: isInline ? "100%" : "auto" }}
    >
      {children ? children : (!isInline && (
        <input 
          readOnly 
          className={`mp-react-input${props.inputClassName ? " " + props.inputClassName : ""}`} 
          value={displayValue} 
          placeholder="Select..."
          style={{ 
            padding: "10px 14px", 
            borderRadius: "10px", 
            border: "1.5px solid rgba(60, 60, 67, 0.12)", 
            background: "#f2f2f7", 
            color: "#1c1c1e",
            cursor: "pointer",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "inherit",
            fontSize: "14px",
            outline: "none",
            ...props.inputStyle
          }}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

export interface ReactDatePickerProps extends Omit<DatePickerOptions, "container" | "open"> {
  open?: boolean;
  onChange?: (value: PickerValue, formatted?: string | string[]) => void;
  onConfirm?: (value: PickerValue) => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  inputStyle?: React.CSSProperties;
  inputClassName?: string;
}

/**
 * React wrapper for the DatePicker (Calendar-style picker).
 */
export const ReactDatePicker: React.FC<ReactDatePickerProps> = ({ children, ...props }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerInstance = useRef<DatePicker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isInline = props.displayMode === "inline" || !props.displayMode;
    const anchor = props.anchor || (props.displayMode === "popover" ? containerRef.current : undefined);
    
    // For non-inline modes, mount to body
    const container = isInline ? containerRef.current : document.body;

    const picker = new DatePicker({
      ...props,
      container,
      anchor,
      displayMode: props.displayMode || "inline",
    });

    pickerInstance.current = picker;

    return () => {
      picker.destroy();
      pickerInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (pickerInstance.current && props.open !== undefined) {
      if (props.open) pickerInstance.current.show();
      else pickerInstance.current.hide();
    }
  }, [props.open]);

  useEffect(() => {
    if (pickerInstance.current) {
      pickerInstance.current.setOptions(props);
    }
  }, [props]);

  const displayValue = useMemo(() => {
    const val = props.value;
    if (!val) return "";
    const fmt = props.format || "YYYY-MM-DD";

    if (val instanceof Date) {
      return formatDate(val, fmt);
    }
    if (Array.isArray(val)) {
      if (val[0] instanceof Date && val[1] instanceof Date) {
        return `${formatDate(val[0], fmt)} - ${formatDate(val[1], fmt)}`;
      }
      if (val[0] instanceof Date) {
        return val.map(d => (d instanceof Date ? formatDate(d, fmt) : "")).join(", ");
      }
    }
    return "";
  }, [props.value, props.format]);

  const isInline = props.displayMode === "inline" || !props.displayMode;

  return (
    <div 
      ref={containerRef} 
      className="date-picker-react-wrapper"
      onClick={(e) => {
        // Stop bubbling so the document 'outside click' doesn't catch it immediately
        e.stopPropagation();
        if (!isInline) pickerInstance.current?.toggle();
      }}
      style={{ display: isInline ? "block" : "inline-block", width: isInline ? "100%" : "auto" }}
    >
      {children ? children : (!isInline && (
        <input 
          readOnly 
          className={`dp-react-input${props.inputClassName ? " " + props.inputClassName : ""}`} 
          value={displayValue} 
          placeholder="Select date..."
          style={{ 
            padding: "10px 14px", 
            borderRadius: "10px", 
            border: "1.5px solid rgba(60, 60, 67, 0.12)", 
            background: "#f2f2f7", 
            color: "#1c1c1e",
            cursor: "pointer",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "inherit",
            fontSize: "14px",
            outline: "none",
            ...props.inputStyle
          }}
        />
      ))}
    </div>
  );
};
