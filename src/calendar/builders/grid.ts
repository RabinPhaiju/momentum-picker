// calendar/builders/grid.ts — Calendar grid and day cell builders

import type { DayRenderInfo, SelectionMode } from "../types";
import type { DatePicker } from "../DatePicker";
import {
  generateCalendarGrid,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  isDateDisabled,
  isInRange,
  isBefore,
  startOfWeek,
  getISOWeekNumber,
} from "../utils";

// ── Calendar Grid ────────────────────────────────────────────────────────────

export function buildGrid(
  this: DatePicker,
  panelYear = this._viewYear,
  panelMonth = this._viewMonth,
): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "dp-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", `${panelYear}-${panelMonth + 1}`);

  const weeks = generateCalendarGrid(panelYear, panelMonth, this.opts.weekStartsOn);
  const colClass = this.opts.showWeekNumbers ? "dp-week-row--8" : "dp-week-row--7";
  const { mode } = this.opts;

  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (mode === "range" && Array.isArray(this._value)) {
    const [s, e] = this._value as [Date | null, Date | null];
    rangeStart = s;
    rangeEnd = e ?? (s ? this._rangeHover : null);
  }

  let selectedWeekStart: Date | null = null;
  if (mode === "week" && this._value instanceof Date) {
    selectedWeekStart = startOfWeek(this._value, this.opts.weekStartsOn);
  }

  weeks.forEach((week) => {
    const row = document.createElement("div");
    const isSelectedWeek = selectedWeekStart
      ? week.some((d) => isSameDay(d, selectedWeekStart!))
      : false;
    row.className = `dp-week-row ${colClass}`;
    if (mode === "week" && isSelectedWeek) row.classList.add("dp-week-row--selected");

    if (this.opts.showWeekNumbers) {
      const wn = document.createElement("div");
      wn.className = "dp-week-num";
      const firstWeekday = week.find((d) => isSameMonth(d, new Date(panelYear, panelMonth)));
      wn.textContent = String(getISOWeekNumber(firstWeekday ?? week[0]));
      if (mode === "week") {
        wn.style.cursor = "pointer";
        wn.addEventListener("click", () => {
          const ws = startOfWeek(firstWeekday ?? week[0], this.opts.weekStartsOn);
          this._selectDate(ws);
        });
      }
      row.appendChild(wn);
    }

    week.forEach((date) => {
      const cell = this._buildDayCell(date, rangeStart, rangeEnd, mode, panelYear, panelMonth);
      row.appendChild(cell);
      if (mode === "week") {
        cell.addEventListener("click", () => {
          const ws = startOfWeek(date, this.opts.weekStartsOn);
          this._selectDate(ws);
        });
      }
    });

    grid.appendChild(row);
  });

  return grid;
}

// ── Day Cell ─────────────────────────────────────────────────────────────────

export function buildDayCell(
  this: DatePicker,
  date: Date,
  rangeStart: Date | null,
  rangeEnd: Date | null,
  mode: SelectionMode,
  panelYear = this._viewYear,
  panelMonth = this._viewMonth,
): HTMLElement {
  const isOutside = !isSameMonth(date, new Date(panelYear, panelMonth));
  const isDisabled = isDateDisabled(
    date,
    this.opts.minDate,
    this.opts.maxDate,
    this.opts.disabledDates,
    this.opts.disabledRanges,
  );
  const todayFlag = isToday(date);
  const weekendFlag = isWeekend(date);
  const isFocused = this._focusedCellDate ? isSameDay(date, this._focusedCellDate) : false;

  let isSelected = false;
  let isStart = false;
  let isEnd = false;
  let inRange = false;

  if (mode === "single" || mode === "week" || mode === "month" || mode === "year" || mode === "datetime-seconds") {
    isSelected = this._value instanceof Date && isSameDay(date, this._value);
  } else if (mode === "range") {
    const [s, e] = this._value as [Date | null, Date | null];
    const effectiveEnd = e ?? this._rangeHover;
    const lo = s && effectiveEnd ? (isBefore(s, effectiveEnd) ? s : effectiveEnd) : s;
    const hi = s && effectiveEnd ? (isBefore(s, effectiveEnd) ? effectiveEnd : s) : effectiveEnd;
    isStart = !!lo && isSameDay(date, lo);
    isEnd = !!hi && isSameDay(date, hi);
    inRange = isInRange(date, lo!, hi!);
    isSelected = isStart || isEnd;
  } else if (mode === "multiple") {
    const arr = (this._value as Date[]) ?? [];
    isSelected = arr.some((d) => isSameDay(d, date));
  }

  const info: DayRenderInfo = {
    date, isToday: todayFlag, isSelected, isInRange: inRange,
    isRangeStart: isStart, isRangeEnd: isEnd, isDisabled,
    isOutsideMonth: isOutside, isWeekend: weekendFlag,
  };

  let cell: HTMLElement;
  // expose the date on the element so touch handlers can look it up later
  // (used for range-drag support on mobile). storing the ISO string is
  // cheap and avoids any runtime calculation during touchmove.
  const dateIso = date.toISOString();

  if (this.opts.renderDay) {
    const custom = this.opts.renderDay(date, info);
    if (custom) {
      cell = document.createElement("button");
      cell.className = "dp-day";
      if (typeof custom === "string") cell.innerHTML = custom;
      else { cell.innerHTML = ""; cell.appendChild(custom); }
    } else {
      cell = this._buildDefaultDayCell(date, info);
    }
  } else {
    cell = this._buildDefaultDayCell(date, info);
  }

  // attach the ISO string regardless of render mode; the attribute is useful
  // for touch-drag range selection and doesn't affect styling.
  cell.dataset.date = dateIso;

  const classes: string[] = [];
  if (todayFlag) classes.push("dp-day--today");
  if (isSelected && mode !== "range") classes.push("dp-day--selected");
  if (isStart) classes.push("dp-day--range-start", "dp-day--selected");
  if (isEnd) classes.push("dp-day--range-end", "dp-day--selected");
  if (inRange && !isStart && !isEnd) classes.push("dp-day--in-range");
  if (isOutside) classes.push("dp-day--outside");
  if (weekendFlag) classes.push("dp-day--weekend");
  if (isDisabled) classes.push("dp-day--disabled");
  if (mode === "multiple" && isSelected) classes.push("dp-day--multi-selected");
  classes.forEach((c) => cell.classList.add(c));

  cell.setAttribute("role", "gridcell");
  cell.setAttribute("aria-label", date.toLocaleDateString(this.opts.locale, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }));
  cell.setAttribute("aria-selected", String(isSelected));
  if (isDisabled) cell.setAttribute("aria-disabled", "true");
  cell.tabIndex = isFocused ? 0 : -1;

  if (mode !== "week" && !isDisabled) {
    if (!isOutside || mode === "range") {
      cell.addEventListener("click", () => this._handleDayClick(date));
    }
    if (mode === "range") {
      cell.addEventListener("pointerenter", (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const [s, eVal] = (this._value as [Date | null, Date | null]) ?? [null, null];
        if (s && !eVal) {
          if (this._rangeHover && isSameDay(this._rangeHover, date)) return;
          this._rangeHover = date;
          this._refresh();
        }
      });
    }
  }
  return cell;
}

export function buildDefaultDayCell(this: DatePicker, date: Date, _info: DayRenderInfo): HTMLElement {
  const cell = document.createElement("button");
  cell.className = "dp-day";
  cell.type = "button";
  cell.textContent = String(date.getDate());
  return cell;
}
