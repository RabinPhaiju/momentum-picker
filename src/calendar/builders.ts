// ─────────────────────────────────────────────────────────────────────────────
// DatePicker – DOM Builder methods
//
// All methods that create/render DOM elements for the calendar UI.
// These are mixed into the DatePicker class at the bottom of DatePicker.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { DayRenderInfo, SelectionMode } from "./types";
import type { DatePicker } from "./DatePicker";
import {
  generateCalendarGrid,
  getDayNames,
  getMonthNames,
  isSameDay,
  isSameMonth,
  isToday,
  isWeekend,
  isDateDisabled,
  isInRange,
  isBefore,
  startOfWeek,
  getISOWeekNumber,
} from "./utils";

// ── Panel Build ─────────────────────────────────────────────────────────────

export function buildPanel(this: DatePicker, extraClass = "", monthOffset = 0): HTMLDivElement {
  const panel = document.createElement("div");
  panel.className = ["dp-panel", extraClass].filter(Boolean).join(" ");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Date Picker");
  this._renderPanelContent(panel, monthOffset);
  return panel;
}

/** Re-renders panel contents in place (header + grid/panel + footer). */
export function renderPanelContent(this: DatePicker, panel: HTMLDivElement, monthOffset = 0): void {
  panel.innerHTML = "";
  // For multi-month, compute the actual year/month for this panel
  const totalMonth = this._viewMonth + monthOffset;
  const panelYear = this._viewYear + Math.floor(totalMonth / 12);
  const panelMonth = ((totalMonth % 12) + 12) % 12;

  panel.appendChild(this._buildHeader(panelYear, panelMonth));

  if (this._viewMode === "day") {
    panel.appendChild(this._buildWeekdays());
    panel.appendChild(this._buildGrid(panelYear, panelMonth));
  } else if (this._viewMode === "month") {
    panel.appendChild(this._buildMonthPanel());
  } else {
    panel.appendChild(this._buildYearPanel());
  }

  if (this._hasFooter()) {
    panel.appendChild(this._buildFooter());
  }
}

// ── Header ──────────────────────────────────────────────────────────────────

export function buildHeader(this: DatePicker, panelYear = this._viewYear, panelMonth = this._viewMonth): HTMLElement {

  // Allow custom renderHeader
  if (this.opts.renderHeader) {
    const viewDate = new Date(panelYear, panelMonth, 1);
    const custom = this.opts.renderHeader(viewDate, this._viewMode);
    if (custom) {
      const wrapper = document.createElement("div");
      wrapper.className = "dp-header";
      if (typeof custom === "string") wrapper.innerHTML = custom;
      else wrapper.appendChild(custom);
      return wrapper;
    }
  }

  const header = document.createElement("div");
  header.className = "dp-header";

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.className = "dp-header-nav";
  prevBtn.setAttribute("aria-label", this._viewMode === "year" ? "Previous decade" : "Previous month");
  prevBtn.innerHTML = "‹";
  prevBtn.addEventListener("click", () => this._navigatePrev());
  header.appendChild(prevBtn);

  // Title (month + year buttons)
  const title = document.createElement("div");
  title.className = "dp-header-title";

  if (this._viewMode === "day") {
    const monthNames = getMonthNames(this.opts.locale);
    const monthBtn = document.createElement("button");
    monthBtn.className = "dp-header-month";
    monthBtn.textContent = monthNames[panelMonth];
    monthBtn.setAttribute("aria-label", `Select month: ${monthNames[panelMonth]}`);
    monthBtn.setAttribute("aria-expanded", "false");
    monthBtn.addEventListener("click", () => {
      this._viewMode = "month";
      this._refresh();
    });

    const yearBtn = document.createElement("button");
    yearBtn.className = "dp-header-year";
    yearBtn.textContent = String(panelYear);
    yearBtn.setAttribute("aria-label", `Select year: ${panelYear}`);
    yearBtn.setAttribute("aria-expanded", "false");
    yearBtn.addEventListener("click", () => {
      this._viewMode = "year";
      this._decadeStart = Math.floor(this._viewYear / 10) * 10;
      this._refresh();
    });

    title.appendChild(monthBtn);
    title.appendChild(yearBtn);
  } else if (this._viewMode === "month") {
    const yearBtn = document.createElement("button");
    yearBtn.className = "dp-header-year";
    yearBtn.textContent = String(this._viewYear);
    yearBtn.setAttribute("aria-label", `Select year: ${this._viewYear}`);
    // Year picker: clicking year in month view goes to year view
    if (this.opts.mode !== "month") {
      yearBtn.addEventListener("click", () => {
        this._viewMode = "year";
        this._decadeStart = Math.floor(this._viewYear / 10) * 10;
        this._refresh();
      });
    } else {
      yearBtn.style.cursor = "default";
    }
    title.appendChild(yearBtn);
  } else {
    const decadeLabel = document.createElement("span");
    decadeLabel.className = "dp-header-year";
    decadeLabel.style.cursor = "default";
    decadeLabel.textContent = `${this._decadeStart} – ${this._decadeStart + 9}`;
    title.appendChild(decadeLabel);
  }

  header.appendChild(title);

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.className = "dp-header-nav";
  nextBtn.setAttribute("aria-label", this._viewMode === "year" ? "Next decade" : "Next month");
  nextBtn.innerHTML = "›";
  nextBtn.addEventListener("click", () => this._navigateNext());
  header.appendChild(nextBtn);

  return header;
}

// ── Weekday Labels ──────────────────────────────────────────────────────────

export function buildWeekdays(this: DatePicker): HTMLElement {
  const row = document.createElement("div");
  const cols = this.opts.showWeekNumbers ? "dp-weekdays--8" : "dp-weekdays--7";
  row.className = `dp-weekdays ${cols}`;

  if (this.opts.showWeekNumbers) {
    const wn = document.createElement("div");
    wn.className = "dp-week-num-header";
    wn.textContent = "W";
    row.appendChild(wn);
  }

  const dayNames = getDayNames(this.opts.locale, this.opts.weekStartsOn);
  const weekendOffset = this.opts.weekStartsOn;
  dayNames.forEach((name, i) => {
    const cell = document.createElement("div");
    // Determine if this position is a weekend day
    const dayIndex = (i + weekendOffset) % 7;
    const isWkend = dayIndex === 0 || dayIndex === 6;
    cell.className = `dp-weekday-label${isWkend ? " dp-weekday-label--weekend" : ""}`;
    cell.textContent = name.slice(0, 2);
    row.appendChild(cell);
  });

  return row;
}

// ── Calendar Grid ───────────────────────────────────────────────────────────

export function buildGrid(this: DatePicker, panelYear = this._viewYear, panelMonth = this._viewMonth): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "dp-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", `${panelYear}-${panelMonth + 1}`);

  const weeks = generateCalendarGrid(panelYear, panelMonth, this.opts.weekStartsOn);
  const colClass = this.opts.showWeekNumbers ? "dp-week-row--8" : "dp-week-row--7";
  const { mode } = this.opts;

  // For range mode, determine start and end from value
  let rangeStart: Date | null = null;
  let rangeEnd: Date | null = null;
  if (mode === "range" && Array.isArray(this._value)) {
    const [s, e] = this._value as [Date | null, Date | null];
    rangeStart = s;
    // Show hover preview only when start is selected but end is not yet
    rangeEnd = e ?? (s ? this._rangeHover : null);
  }

  // For week mode, determine selected week
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

      // Make week numbers clickable in week mode
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

      // Week mode: click on any day cell → select whole week
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

// ── Day Cell ────────────────────────────────────────────────────────────────

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

  // Selection state
  let isSelected = false;
  let isStart = false;
  let isEnd = false;
  let inRange = false;

  if (mode === "single" || mode === "week" || mode === "month" || mode === "year") {
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

  // Build info for renderDay
  const info: DayRenderInfo = {
    date,
    isToday: todayFlag,
    isSelected,
    isInRange: inRange,
    isRangeStart: isStart,
    isRangeEnd: isEnd,
    isDisabled,
    isOutsideMonth: isOutside,
    isWeekend: weekendFlag,
  };

  let cell: HTMLElement;

  // Custom renderer
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

  // Apply classes
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

  // ARIA
  cell.setAttribute("role", "gridcell");
  cell.setAttribute("aria-label", date.toLocaleDateString(this.opts.locale, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }));
  cell.setAttribute("aria-selected", String(isSelected));
  if (isDisabled) cell.setAttribute("aria-disabled", "true");
  cell.tabIndex = isFocused ? 0 : -1;

  // Click (handled at row level for week mode)
  if (mode !== "week" && !isDisabled) {
    // Allow clicks even on outside dates for range mode to allow full range selection
    if (!isOutside || mode === "range") {
      cell.addEventListener("click", () => this._handleDayClick(date));
    }
    // Hover for range preview
    if (mode === "range") {
      cell.addEventListener("mouseenter", () => {
        // Only show hover preview when start is selected but end is not
        const [s, e] = this._value as [Date | null, Date | null];
        if (s && !e) {
          this._rangeHover = date;
          this._refresh();
        }
      });
      // Drag-select
      cell.addEventListener("mousedown", (e) => {
        if (isOutside) return;
        e.preventDefault();
        this._isDragging = true;
        this._rangeAnchor = date;
        this._value = [date, null];
        this._rangeHover = date;
        this._refresh();
      });
      cell.addEventListener("mousemove", () => {
        if (this._isDragging && this._rangeAnchor) {
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

// ── Month Panel ─────────────────────────────────────────────────────────────

export function buildMonthPanel(this: DatePicker): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "dp-panel-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Select month");

  const monthNames = getMonthNames(this.opts.locale);
  const now = new Date();

  monthNames.forEach((name, i) => {
    const isSelectedMonth =
      (this.opts.mode === "month" && this._value instanceof Date &&
        this._value.getFullYear() === this._viewYear && this._value.getMonth() === i) ||
      (this.opts.mode !== "month" && this._viewMonth === i && this._viewYear === this._viewYear);
    const isTodayMonth = i === now.getMonth() && this._viewYear === now.getFullYear();
    const isDisabledMonth = (this.opts.minDate !== null &&
        new Date(this._viewYear, i + 1, 0) < this.opts.minDate!) ||
      (this.opts.maxDate !== null &&
        new Date(this._viewYear, i, 1) > this.opts.maxDate!);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dp-panel-item";
    if (isSelectedMonth) btn.classList.add("dp-panel-item--selected");
    if (isTodayMonth) btn.classList.add("dp-panel-item--today");
    if (isDisabledMonth) btn.classList.add("dp-panel-item--disabled");
    btn.textContent = name.slice(0, 3);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", name);
    btn.setAttribute("aria-selected", String(isSelectedMonth));

    btn.addEventListener("click", () => {
      if (this.opts.mode === "month") {
        const d = new Date(this._viewYear, i, 1);
        this._selectDate(d);
      } else {
        this._viewMonth = i;
        this._viewMode = "day";
        this._refresh();
      }
    });

    grid.appendChild(btn);
  });

  return grid;
}

// ── Year Panel ──────────────────────────────────────────────────────────────

export function buildYearPanel(this: DatePicker): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "dp-panel-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "Select year");

  const now = new Date();
  const years = Array.from({ length: 12 }, (_, i) => this._decadeStart - 1 + i);

  years.forEach((year) => {
    const isSelectedYear =
      (this.opts.mode === "year" && this._value instanceof Date && this._value.getFullYear() === year) ||
      (this.opts.mode !== "year" && year === this._viewYear);
    const isTodayYear = year === now.getFullYear();
    const isOutOfDecade = year < this._decadeStart || year > this._decadeStart + 9;
    const isDisabledYear =
      (this.opts.minDate !== null && year < this.opts.minDate!.getFullYear()) ||
      (this.opts.maxDate !== null && year > this.opts.maxDate!.getFullYear());

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dp-panel-item";
    if (isSelectedYear) btn.classList.add("dp-panel-item--selected");
    if (isTodayYear) btn.classList.add("dp-panel-item--today");
    if (isDisabledYear) btn.classList.add("dp-panel-item--disabled");
    if (isOutOfDecade) {
      btn.style.opacity = "0.35";
      btn.style.fontSize = "12px";
    }
    btn.textContent = String(year);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Year ${year}`);
    btn.setAttribute("aria-selected", String(isSelectedYear));

    btn.addEventListener("click", () => {
      if (this.opts.mode === "year") {
        const d = new Date(year, 0, 1);
        this._selectDate(d);
      } else {
        this._viewYear = year;
        this._viewMode = "month";
        this._refresh();
      }
    });

    grid.appendChild(btn);
  });

  return grid;
}

// ── Footer ──────────────────────────────────────────────────────────────────

export function hasFooter(this: DatePicker): boolean {
  return this.opts.showToday || this.opts.showClear || this.opts.showActions;
}

export function buildFooter(this: DatePicker): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "dp-footer";

  const left = document.createElement("div");
  left.className = "dp-footer-left";

  if (this.opts.showToday) {
    const todayBtn = document.createElement("button");
    todayBtn.className = "dp-btn dp-btn--ghost";
    todayBtn.type = "button";
    todayBtn.textContent = "Today";
    todayBtn.setAttribute("aria-label", "Navigate to today");
    todayBtn.addEventListener("click", () => this._goToToday());
    left.appendChild(todayBtn);
  }

  if (this.opts.showClear) {
    const clearBtn = document.createElement("button");
    clearBtn.className = "dp-btn dp-btn--ghost";
    clearBtn.type = "button";
    clearBtn.textContent = "Clear";
    clearBtn.setAttribute("aria-label", "Clear selection");
    clearBtn.addEventListener("click", () => this._clearValue());
    left.appendChild(clearBtn);
  }

  footer.appendChild(left);

  if (this.opts.showActions) {
    const right = document.createElement("div");
    right.className = "dp-footer-right";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "dp-btn dp-btn--cancel";
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => this._handleCancel());
    right.appendChild(cancelBtn);

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "dp-btn dp-btn--confirm";
    confirmBtn.type = "button";
    confirmBtn.textContent = "Done";
    confirmBtn.addEventListener("click", () => this._handleConfirm());
    right.appendChild(confirmBtn);

    footer.appendChild(right);
  }

  return footer;
}
