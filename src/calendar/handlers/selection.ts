// calendar/handlers/selection.ts — Date selection logic

import type { DatePicker } from "../DatePicker";
import { isSameDay, isBefore, cloneDate } from "../utils";

export function handleDayClick(this: DatePicker, date: Date): void {
  if (this.opts.onValidate) {
    const err = this.opts.onValidate(date);
    if (err) { this._showValidationError(err); return; }
  }
  this._selectDate(date);
}

export function selectDate(this: DatePicker, date: Date): void {
  const { mode } = this.opts;

  if (mode === "single" || mode === "week" || mode === "month" || mode === "year" || mode === "datetime-seconds") {
    const d = cloneDate(date);
    if (this.opts.showTimePicker || mode === "datetime-seconds") {
      d.setHours(this._selectedHour, this._selectedMinute, this._selectedSecond, 0);
    }
    this._value = d;
    this._emitChange();
    if (!this.opts.showActions && this.opts.displayMode !== "inline") {
      this._emitConfirm();
      this.hide();
    }

  } else if (mode === "range") {
    const [start, end] = this._value as [Date | null, Date | null];
    if (!start || (start && end)) {
      this._value = [cloneDate(date), null];
      this._rangeAnchor = cloneDate(date);
      this._rangeHover = cloneDate(date);
    } else {
      const [lo, hi] = isBefore(start, date) ? [start, date] : [date, start];
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
    if (idx >= 0) arr.splice(idx, 1);
    else { arr.push(cloneDate(date)); arr.sort((a, b) => a.getTime() - b.getTime()); }
    this._value = arr;
    this._emitChange();
  }

  this._refresh();
}

export function clearValue(this: DatePicker): void {
  if (this.opts.mode === "multiple") this._value = [];
  else if (this.opts.mode === "range") this._value = [null, null];
  else this._value = null;
  this._rangeAnchor = null;
  this._rangeHover = null;
  this._selectedHour = 0;
  this._selectedMinute = 0;
  this._selectedSecond = 0;
  this._emitChange();
  this._refresh();
}
