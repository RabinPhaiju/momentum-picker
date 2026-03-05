// calendar/handlers/navigation.ts — Month/year navigation and quick-select

import type { DatePicker } from "../DatePicker";
import { prevMonth, nextMonth } from "../utils";

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
  this._selectedHour = today.getHours();
  this._selectedMinute = today.getMinutes();
  this._selectedSecond = today.getSeconds();
  const { mode } = this.opts;
  if (mode === "single" || mode === "week" || mode === "datetime-seconds") {
    this._viewMode = "day";
    this._selectDate(today);
  } else if (mode === "month") {
    this._viewMode = "month";
    this._selectDate(today);
  } else if (mode === "year") {
    this._viewMode = "year";
    this._selectDate(today);
  } else {
    this._viewMode = "day";
    this._refresh();
  }
}
