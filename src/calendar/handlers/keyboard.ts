// calendar/handlers/keyboard.ts — Keyboard navigation

import type { DatePicker } from "../DatePicker";
import { isSameMonth, cloneDate, isBefore } from "../utils";

export function handleGlobalKeydown(this: DatePicker, e: KeyboardEvent): void {
  if (!this._open && this.opts.displayMode !== "inline") return;

  switch (e.key) {
    case "Escape":
      if (this.opts.displayMode !== "inline") { e.preventDefault(); this._handleCancel(); }
      break;
    case "ArrowLeft": e.preventDefault(); this._moveFocus(-1); break;
    case "ArrowRight": e.preventDefault(); this._moveFocus(1); break;
    case "ArrowUp": e.preventDefault(); this._moveFocus(-7); break;
    case "ArrowDown": e.preventDefault(); this._moveFocus(7); break;
    case "PageUp": e.preventDefault(); this._navigatePrev(); break;
    case "PageDown": e.preventDefault(); this._navigateNext(); break;
    case "Enter":
    case " ":
      if (this._focusedCellDate) { e.preventDefault(); this._handleDayClick(this._focusedCellDate); }
      break;
    case "Home":
      e.preventDefault();
      this._focusedCellDate = new Date(this._viewYear, this._viewMonth, 1);
      this._refresh();
      break;
    case "End": {
      e.preventDefault();
      const lastDay = new Date(this._viewYear, this._viewMonth + 1, 0).getDate();
      this._focusedCellDate = new Date(this._viewYear, this._viewMonth, lastDay);
      this._refresh();
      break;
    }
  }
}

export function moveFocus(this: DatePicker, delta: number): void {
  const base = this._focusedCellDate
    ? cloneDate(this._focusedCellDate)
    : (this._value instanceof Date ? cloneDate(this._value) : new Date(this._viewYear, this._viewMonth, 1));

  base.setDate(base.getDate() + delta);

  if (!isSameMonth(base, new Date(this._viewYear, this._viewMonth))) {
    this._viewYear = base.getFullYear();
    this._viewMonth = base.getMonth();
  }

  this._focusedCellDate = base;
  this._refresh();

  requestAnimationFrame(() => {
    const cells = this._getPanel()?.querySelectorAll<HTMLElement>(".dp-day") ?? [];
    for (const cell of cells) {
      if (cell.tabIndex === 0) { cell.focus(); break; }
    }
  });
}

export function handleGlobalMouseup(this: DatePicker): void {
  if (this._isDragging && this._rangeAnchor && this._rangeHover) {
    const lo = isBefore(this._rangeAnchor, this._rangeHover) ? this._rangeAnchor : this._rangeHover;
    const hi = isBefore(this._rangeAnchor, this._rangeHover) ? this._rangeHover : this._rangeAnchor;
    this._value = [cloneDate(lo), cloneDate(hi)];
    this._rangeAnchor = null;
    this._rangeHover = null;
    this._isDragging = false;
    this._emitChange();
    this._refresh();
  }
  this._isDragging = false;
}
