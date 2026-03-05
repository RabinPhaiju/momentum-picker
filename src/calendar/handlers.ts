// ─────────────────────────────────────────────────────────────────────────────
// DatePicker – Event Handlers & Selection Logic
//
// All methods for handling user interactions: clicks, keyboard, drag-select,
// navigation, show/hide, and value emission.
// These are mixed into the DatePicker class at the bottom of DatePicker.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { DatePicker } from "./DatePicker";
import type { PopoverPlacement } from "./positioning";
import { createAutoUpdater } from "./positioning";
import {
  isSameDay,
  isSameMonth,
  isBefore,
  cloneDate,
  prevMonth,
  nextMonth,
  formatValue,
} from "./utils";

// ── Selection Logic ─────────────────────────────────────────────────────────

export function handleDayClick(this: DatePicker, date: Date): void {
  // Validate
  if (this.opts.onValidate) {
    const err = this.opts.onValidate(date);
    if (err) {
      this._showValidationError(err);
      return;
    }
  }

  this._selectDate(date);
}

export function selectDate(this: DatePicker, date: Date): void {
  const { mode } = this.opts;

  if (mode === "single" || mode === "week" || mode === "month" || mode === "year") {
    this._value = cloneDate(date);
    this._emitChange();
    if (!this.opts.showActions) {
      // Auto-dismiss popover/modal on single selection unless showing actions
      if (this.opts.displayMode !== "inline") {
        this._emitConfirm();
        this.hide();
      }
    }

  } else if (mode === "range") {
    const [start, end] = this._value as [Date | null, Date | null];

    if (!start || (start && end)) {
      // Start new range
      this._value = [cloneDate(date), null];
      this._rangeAnchor = cloneDate(date);
      this._rangeHover = cloneDate(date);
    } else {
      // Complete the range
      const s = start;
      const e = date;
      const [lo, hi] = isBefore(s, e) ? [s, e] : [e, s];
      this._value = [cloneDate(lo), cloneDate(hi)];
      this._rangeAnchor = null;
      this._rangeHover = null;
      this._emitChange();
      if (!this.opts.showActions && this.opts.displayMode !== "inline") {
        this._emitConfirm();
        this.hide();
      }
    }

  } else if (mode === "multiple") {
    const arr = [...((this._value as Date[]) ?? [])];
    const idx = arr.findIndex((d) => isSameDay(d, date));
    if (idx >= 0) {
      arr.splice(idx, 1); // deselect
    } else {
      arr.push(cloneDate(date));
      arr.sort((a, b) => a.getTime() - b.getTime());
    }
    this._value = arr;
    this._emitChange();
  }

  this._refresh();
}

// ── Navigation ──────────────────────────────────────────────────────────────

export function navigatePrev(this: DatePicker): void {
  if (this._viewMode === "day") {
    const { year, month } = prevMonth(this._viewYear, this._viewMonth);
    this._viewYear = year;
    this._viewMonth = month;
  } else if (this._viewMode === "month") {
    this._viewYear -= 1;
  } else {
    this._decadeStart -= 10;
  }
  this._refresh();
}

export function navigateNext(this: DatePicker): void {
  if (this._viewMode === "day") {
    const { year, month } = nextMonth(this._viewYear, this._viewMonth);
    this._viewYear = year;
    this._viewMonth = month;
  } else if (this._viewMode === "month") {
    this._viewYear += 1;
  } else {
    this._decadeStart += 10;
  }
  this._refresh();
}

export function goToToday(this: DatePicker): void {
  const today = new Date();
  this._viewYear = today.getFullYear();
  this._viewMonth = today.getMonth();
  // For single/week/month/year modes, also select today
  const { mode } = this.opts;
  if (mode === "single" || mode === "week") {
    this._viewMode = "day";
    this._selectDate(today);
  } else if (mode === "month") {
    this._viewMode = "month";
    this._selectDate(today);
  } else if (mode === "year") {
    this._viewMode = "year";
    this._selectDate(today);
  } else {
    // range / multiple — just navigate
    this._viewMode = "day";
    this._refresh();
  }
}

export function clearValue(this: DatePicker): void {
  if (this.opts.mode === "multiple") {
    this._value = [];
  } else if (this.opts.mode === "range") {
    this._value = [null, null];
  } else {
    this._value = null;
  }
  this._rangeAnchor = null;
  this._rangeHover = null;
  this._emitChange();
  this._refresh();
}

// ── Show / Hide ─────────────────────────────────────────────────────────────

export function show(this: DatePicker, animate = true): void {
  const { displayMode } = this.opts;

  if (displayMode === "modal" && this._overlayEl) {
    if (animate) {
      requestAnimationFrame(() => {
        this._overlayEl!.classList.add("dp-open");
      });
    } else {
      this._overlayEl.classList.add("dp-open");
    }
  }

  if (displayMode === "popover" && this._panelEl && this._anchorEl) {
    this._panelEl.style.display = "block";
    // Position the panel
    this._stopAutoUpdate = createAutoUpdater(
      this._anchorEl,
      this._panelEl,
      ({ top, left }) => {
        this._panelEl!.style.top = `${top}px`;
        this._panelEl!.style.left = `${left}px`;
      },
      "bottom-start" as PopoverPlacement,
    );
    // Animate in
    if (animate) {
      this._panelEl.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (this._panelEl) this._panelEl.style.opacity = "";
        });
      });
    }
  }

  this._open = true;
  this.opts.onOpenChange?.(true);

  // Focus management
  setTimeout(() => {
    const focused = this._getPanel()?.querySelector<HTMLElement>("[tabindex='0']");
    focused?.focus();
  }, 50);
}

export function hide(this: DatePicker, animate = true): void {
  const { displayMode } = this.opts;

  if (displayMode === "modal" && this._overlayEl) {
    this._overlayEl.classList.remove("dp-open");
  }

  if (displayMode === "popover" && this._panelEl) {
    this._panelEl.style.display = "none";
    this._stopAutoUpdate?.();
    this._stopAutoUpdate = null;
  }

  this._open = false;
  this.opts.onOpenChange?.(false);
}

// ── Keyboard ────────────────────────────────────────────────────────────────

export function handleGlobalKeydown(this: DatePicker, e: KeyboardEvent): void {
  if (!this._open && this.opts.displayMode !== "inline") return;

  switch (e.key) {
    case "Escape":
      if (this.opts.displayMode !== "inline") {
        e.preventDefault();
        this._handleCancel();
      }
      break;
    case "ArrowLeft":
      e.preventDefault();
      this._moveFocus(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      this._moveFocus(1);
      break;
    case "ArrowUp":
      e.preventDefault();
      this._moveFocus(-7);
      break;
    case "ArrowDown":
      e.preventDefault();
      this._moveFocus(7);
      break;
    case "PageUp":
      e.preventDefault();
      e.shiftKey ? this._navigatePrev() : this._navigatePrev();
      break;
    case "PageDown":
      e.preventDefault();
      e.shiftKey ? this._navigateNext() : this._navigateNext();
      break;
    case "Enter":
    case " ":
      if (this._focusedCellDate) {
        e.preventDefault();
        this._handleDayClick(this._focusedCellDate);
      }
      break;
    case "Home":
      e.preventDefault();
      // Navigate to first day of current month
      this._focusedCellDate = new Date(this._viewYear, this._viewMonth, 1);
      this._refresh();
      break;
    case "End":
      e.preventDefault();
      // Navigate to last day of current month
      const lastDay = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      this._focusedCellDate = new Date(this._viewYear, this._viewMonth, lastDay);
      this._refresh();
      break;
  }
}

export function moveFocus(this: DatePicker, delta: number): void {
  const base = this._focusedCellDate
    ? cloneDate(this._focusedCellDate)
    : (this._value instanceof Date ? cloneDate(this._value) : new Date(this._viewYear, this._viewMonth, 1));

  base.setDate(base.getDate() + delta);

  // If we've navigated to a different month, switch view
  if (!isSameMonth(base, new Date(this._viewYear, this._viewMonth))) {
    this._viewYear = base.getFullYear();
    this._viewMonth = base.getMonth();
  }

  this._focusedCellDate = base;
  this._refresh();

  // Focus the DOM cell
  requestAnimationFrame(() => {
    const panel = this._getPanel();
    if (!panel || !this._focusedCellDate) return;
    const cells = panel.querySelectorAll<HTMLElement>(".dp-day");
    for (const cell of cells) {
      if (cell.tabIndex === 0) { cell.focus(); break; }
    }
  });
}

// ── Mouse & Outside Click ───────────────────────────────────────────────────

export function handleGlobalMouseup(this: DatePicker, _e: MouseEvent): void {
  if (this._isDragging && this._rangeAnchor && this._rangeHover) {
    const lo = isBefore(this._rangeAnchor, this._rangeHover)
      ? this._rangeAnchor : this._rangeHover;
    const hi = isBefore(this._rangeAnchor, this._rangeHover)
      ? this._rangeHover : this._rangeAnchor;
    this._value = [cloneDate(lo), cloneDate(hi)];
    this._rangeAnchor = null;
    this._rangeHover = null;
    this._isDragging = false;
    this._emitChange();
    this._refresh();
  }
  this._isDragging = false;
}

export function handleOutsideClick(this: DatePicker, e: MouseEvent): void {
  if (!this._open) return;
  const target = e.target as Node;
  // If click is inside the panel, ignore
  if (this._panelEl?.contains(target)) return;
  // If click is on the anchor element itself, let the anchor's own handler manage toggle
  if (this._anchorEl?.contains(target)) return;
  // Defer so the triggering click (which opens the popover) is not caught immediately
  setTimeout(() => {
    if (this._open) this._handleCancel();
  }, 0);
}

export function handleCancel(this: DatePicker): void {
  this.opts.onCancel?.();
  this._hide();
}

export function handleConfirm(this: DatePicker): void {
  this._emitConfirm();
  this._hide();
}

// ── Emit Helpers ────────────────────────────────────────────────────────────

export function emitChange(this: DatePicker): void {
  if (this.opts.onChange) {
    const formatted = this.opts.format
      ? formatValue(this._value, this.opts.format, this.opts.mode)
      : undefined;
    this.opts.onChange(this._value, formatted);
  }
}

export function emitConfirm(this: DatePicker): void {
  this.opts.onConfirm?.(this._value);
}

export function showValidationError(this: DatePicker, message: string): void {
  const panel = this._getPanel();
  if (!panel) return;
  let err = panel.querySelector<HTMLElement>(".dp-error");
  if (!err) {
    err = document.createElement("div");
    err.className = "dp-error";
    panel.appendChild(err);
  }
  err.textContent = message;
  setTimeout(() => err?.remove(), 3000);
}
