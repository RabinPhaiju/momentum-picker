// ─────────────────────────────────────────────────────────────────────────────
// calendar/DatePicker.ts — Full-featured calendar DatePicker.
//
// Supports:
//   • Selection modes: single, range, multiple, week, month, year
//   • Display modes: inline, popover (smart-flip), modal
//   • Min/max dates, disabled dates, disabled ranges
//   • Today + Clear buttons, Cancel/Confirm actions
//   • Day / Month / Year drilldown views
//   • Custom renderDay / renderHeader
//   • Dark mode + CSS variable theming
//   • Full keyboard navigation (arrows, Enter, Escape, PageUp/Down)
//   • ARIA: role="dialog", role="grid", role="gridcell", aria-selected
//   • SSR safe: no document access at module load time
//   • Drag-to-select range via mouse
// ─────────────────────────────────────────────────────────────────────────────

import "../styles/base.css";
import "../styles/calendar.css";

import type {
  DatePickerOptions,
  ResolvedDPOptions,
  SelectionMode,
  ViewMode,
  DayRenderInfo,
  PickerValue,
} from "./types";
import type { PopoverPlacement } from "./positioning";
import { createAutoUpdater } from "./positioning";
import {
  generateCalendarGrid,
  getDayNames,
  getMonthNames,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isWeekend,
  isDateDisabled,
  isInRange,
  startOfWeek,
  getISOWeekNumber,
  cloneDate,
  formatDate,
  formatValue,
  prevMonth,
  nextMonth,
  startOfDay,
  isBefore,
  isAfter,
} from "./utils";

// ── Constants ─────────────────────────────────────────────────────────────────
const MIN_YEAR = 1924;
const MAX_YEAR = 2124;

// ─────────────────────────────────────────────────────────────────────────────

export class DatePicker {
  // ── Options ────────────────────────────────────────────────────────────────
  private opts: ResolvedDPOptions;
  private isControlled: boolean;

  // ── Internal state ─────────────────────────────────────────────────────────
  private _value: PickerValue;
  private _open: boolean;
  private _viewYear: number;
  private _viewMonth: number;
  private _viewMode: ViewMode = "day";

  // Range-drag tracking
  private _rangeAnchor: Date | null = null;       // first clicked date in range
  private _rangeHover: Date | null = null;         // currently hovered date
  private _isDragging = false;

  // Year panel: current decade start
  private _decadeStart: number;

  // ── DOM roots ──────────────────────────────────────────────────────────────
  private _containerEl: HTMLElement | null = null;
  private _anchorEl: HTMLElement | null = null;
  private _overlayEl: HTMLDivElement | null = null;
  private _panelEl: HTMLDivElement | null = null;

  // Cleanup functions
  private _stopAutoUpdate: (() => void) | null = null;
  private _stopAutoUpdateFn: (() => void) | null = null;
  private _boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private _boundMouseup: ((e: MouseEvent) => void) | null = null;
  private _boundOutsideClick: ((e: MouseEvent) => void) | null = null;

  private _focusedCellDate: Date | null = null;

  // Multi-month view offsets (for numberOfMonths > 1)
  private _panels: HTMLDivElement[] = [];
  private _panelViewOffsets: number[] = []; // month offset from _viewYear/_viewMonth for each panel

  // ─────────────────────────────────────────────────────────────────────────────

  constructor(options: DatePickerOptions) {
    this.opts = this._resolveOptions(options);
    this.isControlled = options.value !== undefined;

    // Value state
    this._value = this._resolveInitialValue(options);

    // View state
    const viewDate = this._getViewDateFromValue() ?? options.defaultViewDate ?? new Date();
    this._viewYear = viewDate.getFullYear();
    this._viewMonth = viewDate.getMonth();
    this._decadeStart = Math.floor(this._viewYear / 10) * 10;

    // Set initial view mode based on picker mode
    if (this.opts.mode === "month") {
      this._viewMode = "month";
    } else if (this.opts.mode === "year") {
      this._viewMode = "year";
    } else {
      this._viewMode = "day";
    }

    // Resolve container / anchor
    if (options.container) {
      this._containerEl = this._resolveEl(options.container);
    }
    if (options.anchor) {
      this._anchorEl = this._resolveEl(options.anchor);
    }

    // Determine initial open state
    if (options.open !== undefined) {
      this._open = options.open;
    } else if (options.defaultOpen !== undefined) {
      this._open = options.defaultOpen;
    } else {
      this._open = this.opts.displayMode === "inline";
    }

    // Mount
    this._mount();
    if (this._open) this._show(false);
  }

  // ── Option Resolution ──────────────────────────────────────────────────────

  private _resolveOptions(opts: DatePickerOptions): ResolvedDPOptions {
    const n = opts.numberOfMonths ?? 1;
    return {
      displayMode: opts.displayMode ?? "inline",
      mode: opts.mode ?? "single",
      numberOfMonths: Math.max(1, Math.min(n, 6)),
      value: opts.value ?? null,
      open: opts.open ?? false,
      minDate: opts.minDate ?? null,
      maxDate: opts.maxDate ?? null,
      disabledDates: opts.disabledDates ?? null,
      disabledRanges: opts.disabledRanges ?? null,
      defaultViewDate: opts.defaultViewDate ?? new Date(),
      weekStartsOn: opts.weekStartsOn ?? 0,
      showWeekNumbers: opts.showWeekNumbers ?? (opts.mode === "week" ? true : false),
      format: opts.format ?? null,
      locale: opts.locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-US"),
      showToday: opts.showToday ?? true,
      showClear: opts.showClear ?? false,
      showActions:
        opts.showActions ??
        (opts.displayMode === "modal" || opts.displayMode === "popover"),
      theme: opts.theme ?? "light",
      primaryColor: opts.primaryColor ?? "#007aff",
      className: opts.className ?? "",
      renderDay: opts.renderDay,
      renderHeader: opts.renderHeader,
      onChange: opts.onChange,
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
      onValidate: opts.onValidate,
      onOpenChange: opts.onOpenChange,
    };
  }

  private _resolveInitialValue(opts: DatePickerOptions): PickerValue {
    const raw = opts.value ?? opts.defaultValue ?? null;
    if (opts.mode === "multiple") {
      return Array.isArray(raw) ? (raw as Date[]) : raw instanceof Date ? [raw] : [];
    }
    if (opts.mode === "range") {
      if (Array.isArray(raw)) return raw as [Date | null, Date | null];
      return [null, null];
    }
    if (raw instanceof Date) return raw;
    return null;
  }

  private _getViewDateFromValue(): Date | null {
    const v = this._value;
    if (v instanceof Date) return v;
    if (Array.isArray(v) && v.length > 0 && v[0] instanceof Date) return v[0] as Date;
    return null;
  }

  private _resolveEl(target: string | HTMLElement): HTMLElement {
    if (typeof target === "string") {
      const el = document.querySelector<HTMLElement>(target);
      if (!el) throw new Error(`[DatePicker] Element "${target}" not found`);
      return el;
    }
    return target;
  }

  // ── Mount ──────────────────────────────────────────────────────────────────

  private _mount(): void {
    const { displayMode } = this.opts;

    this._overlayEl = document.createElement("div");
    this._overlayEl.className = "dp-root";
    if (this.opts.primaryColor !== "#007aff") {
      this._overlayEl.style.setProperty("--dp-primary", this.opts.primaryColor);
    }
    this._overlayEl.dataset.dpTheme = this.opts.theme;
    if (this.opts.className) {
      this.opts.className.split(" ").filter(Boolean).forEach((c) => this._overlayEl!.classList.add(c));
    }

    if (displayMode === "inline") {
      // Render directly inside container
      if (this.opts.numberOfMonths > 1) {
        const wrap = document.createElement("div");
        wrap.className = "dp-multi-wrap";
        for (let i = 0; i < this.opts.numberOfMonths; i++) {
          const panel = this._buildPanel("dp-panel--inline", i);
          this._panels.push(panel);
          this._panelViewOffsets.push(i);
          wrap.appendChild(panel);
        }
        this._overlayEl.appendChild(wrap);
      } else {
        const panel = this._buildPanel("dp-panel--inline");
        this._overlayEl.appendChild(panel);
      }
      this._containerEl!.appendChild(this._overlayEl);
    } else if (displayMode === "modal") {
      // Render centred overlay
      this._overlayEl.className += " dp-overlay";
      this._overlayEl.setAttribute("role", "dialog");
      this._overlayEl.setAttribute("aria-modal", "true");
      this._overlayEl.setAttribute("aria-label", "Date Picker");
      this._overlayEl.addEventListener("click", (e) => {
        if (e.target === this._overlayEl) this._handleCancel();
      });
      const panel = this._buildPanel();
      this._panelEl = panel;
      this._overlayEl.appendChild(panel);
      (this._containerEl ?? document.body).appendChild(this._overlayEl);
    } else if (displayMode === "popover") {
      // Render floating popover anchored to _anchorEl
      const panel = this._buildPanel("dp-panel--popover");
      this._panelEl = panel;
      panel.style.display = "none";
      this._overlayEl.appendChild(panel);
      document.body.appendChild(this._overlayEl);
    }

    // Global keyboard handler
    this._boundKeydown = this._handleGlobalKeydown.bind(this);
    document.addEventListener("keydown", this._boundKeydown);

    // Global mouseup for drag-select
    this._boundMouseup = this._handleGlobalMouseup.bind(this);
    window.addEventListener("mouseup", this._boundMouseup);

    // Popover: close on outside click (deferred so the triggering click is ignored)
    if (displayMode === "popover") {
      this._boundOutsideClick = this._handleOutsideClick.bind(this);
      document.addEventListener("click", this._boundOutsideClick, true);
    }
  }

  // ── Panel Build ────────────────────────────────────────────────────────────

  private _buildPanel(extraClass = "", monthOffset = 0): HTMLDivElement {
    const panel = document.createElement("div");
    panel.className = ["dp-panel", extraClass].filter(Boolean).join(" ");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Date Picker");
    this._renderPanelContent(panel, monthOffset);
    return panel;
  }

  /** Re-renders panel contents in place (header + grid/panel + footer). */
  private _renderPanelContent(panel: HTMLDivElement, monthOffset = 0): void {
    panel.innerHTML = "";
    // For multi-month, compute the actual year/month for this panel
    const totalMonth = this._viewMonth + monthOffset;
    const panelYear = this._viewYear + Math.floor(totalMonth / 12);
    const panelMonth = ((totalMonth % 12) + 12) % 12;

    panel.appendChild(this._buildHeader(panelYear, panelMonth, monthOffset));

    if (this._viewMode === "day") {
      panel.appendChild(this._buildWeekdays());
      panel.appendChild(this._buildGrid(panelYear, panelMonth));
    } else if (this._viewMode === "month") {
      panel.appendChild(this._buildMonthPanel());
    } else {
      panel.appendChild(this._buildYearPanel());
    }

    // Only show footer on the last panel (or single panel)
    if (this._hasFooter() && monthOffset === this.opts.numberOfMonths - 1) {
      panel.appendChild(this._buildFooter());
    }
  }

  private _refresh(): void {
    if (this.opts.displayMode === "inline" && this.opts.numberOfMonths > 1) {
      // Refresh each panel with its own month offset
      this._panels.forEach((panel, i) => {
        this._renderPanelContent(panel, this._panelViewOffsets[i]);
      });
      return;
    }
    const panel = this._getPanel();
    if (panel) this._renderPanelContent(panel);
  }

  private _getPanel(): HTMLDivElement | null {
    if (this.opts.displayMode === "inline" && this.opts.numberOfMonths <= 1) {
      return this._overlayEl?.querySelector<HTMLDivElement>(".dp-panel") ?? null;
    }
    return this._panelEl;
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  private _buildHeader(panelYear = this._viewYear, panelMonth = this._viewMonth, panelIndex = 0): HTMLElement {
    const isMulti = this.opts.numberOfMonths > 1;
    const isFirst = panelIndex === 0;
    const isLast = panelIndex === this.opts.numberOfMonths - 1;

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

    // Prev button — only on first panel (or single panel)
    const prevBtn = document.createElement("button");
    prevBtn.className = "dp-header-nav";
    prevBtn.setAttribute("aria-label", this._viewMode === "year" ? "Previous decade" : "Previous month");
    prevBtn.innerHTML = "‹";
    if (isMulti && !isFirst) prevBtn.style.visibility = "hidden";
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
      // Don't allow drilldown in multi-month mode
      if (!isMulti) {
        monthBtn.addEventListener("click", () => {
          this._viewMode = "month";
          this._refresh();
        });
      } else {
        monthBtn.style.cursor = "default";
      }

      const yearBtn = document.createElement("button");
      yearBtn.className = "dp-header-year";
      yearBtn.textContent = String(panelYear);
      yearBtn.setAttribute("aria-label", `Select year: ${panelYear}`);
      yearBtn.setAttribute("aria-expanded", "false");
      if (!isMulti) {
        yearBtn.addEventListener("click", () => {
          this._viewMode = "year";
          this._decadeStart = Math.floor(this._viewYear / 10) * 10;
          this._refresh();
        });
      } else {
        yearBtn.style.cursor = "default";
      }

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

    // Next button — only on last panel (or single panel)
    const nextBtn = document.createElement("button");
    nextBtn.className = "dp-header-nav";
    nextBtn.setAttribute("aria-label", this._viewMode === "year" ? "Next decade" : "Next month");
    nextBtn.innerHTML = "›";
    if (isMulti && !isLast) nextBtn.style.visibility = "hidden";
    nextBtn.addEventListener("click", () => this._navigateNext());
    header.appendChild(nextBtn);

    return header;
  }

  // ── Weekday Labels ─────────────────────────────────────────────────────────

  private _buildWeekdays(): HTMLElement {
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

  // ── Calendar Grid ─────────────────────────────────────────────────────────

  private _buildGrid(panelYear = this._viewYear, panelMonth = this._viewMonth): HTMLElement {
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
      row.className = `dp-week-row ${colClass}`;
      row.setAttribute("role", "row");

      // Check if whole week is selected (week mode)
      if (mode === "week" && selectedWeekStart) {
        const weekStart = startOfWeek(week[0], this.opts.weekStartsOn);
        if (isSameDay(weekStart, selectedWeekStart)) {
          row.classList.add("dp-week-row--selected");
        }
      }

      // Week number — clickable in week mode
      if (this.opts.showWeekNumbers) {
        const wn = document.createElement("div");
        wn.className = "dp-week-num";
        wn.textContent = `W${getISOWeekNumber(week[0])}`;
        if (mode === "week") {
          wn.style.cursor = "pointer";
          wn.addEventListener("click", () => {
            const ws = startOfWeek(week[0], this.opts.weekStartsOn);
            this._selectDate(ws);
          });
        }
        row.appendChild(wn);
      }

      week.forEach((date) => {
        const cell = this._buildDayCell(date, rangeStart, rangeEnd, mode);
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

  private _buildDayCell(
    date: Date,
    rangeStart: Date | null,
    rangeEnd: Date | null,
    mode: SelectionMode,
  ): HTMLElement {
    const isOutside = !isSameMonth(date, new Date(this._viewYear, this._viewMonth));
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

  private _buildDefaultDayCell(date: Date, _info: DayRenderInfo): HTMLElement {
    const cell = document.createElement("button");
    cell.className = "dp-day";
    cell.type = "button";
    cell.textContent = String(date.getDate());
    return cell;
  }

  // ── Month Panel ────────────────────────────────────────────────────────────

  private _buildMonthPanel(): HTMLElement {
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

  // ── Year Panel ─────────────────────────────────────────────────────────────

  private _buildYearPanel(): HTMLElement {
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

  // ── Footer ─────────────────────────────────────────────────────────────────

  private _hasFooter(): boolean {
    return this.opts.showToday || this.opts.showClear || this.opts.showActions;
  }

  private _buildFooter(): HTMLElement {
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

  // ── Selection Logic ────────────────────────────────────────────────────────

  private _handleDayClick(date: Date): void {
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

  private _selectDate(date: Date): void {
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

  // ── Navigation ─────────────────────────────────────────────────────────────

  private _navigatePrev(): void {
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

  private _navigateNext(): void {
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

  private _goToToday(): void {
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

  private _clearValue(): void {
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

  // ── Show / Hide ────────────────────────────────────────────────────────────

  private _show(animate = true): void {
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

  private _hide(animate = true): void {
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

  // ── Event Handlers ─────────────────────────────────────────────────────────

  private _handleGlobalKeydown(e: KeyboardEvent): void {
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

  private _moveFocus(delta: number): void {
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

  private _handleGlobalMouseup(_e: MouseEvent): void {
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

  private _handleOutsideClick(e: MouseEvent): void {
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

  private _handleCancel(): void {
    this.opts.onCancel?.();
    this._hide();
  }

  private _handleConfirm(): void {
    this._emitConfirm();
    this._hide();
  }

  // ── Emit Helpers ───────────────────────────────────────────────────────────

  private _emitChange(): void {
    if (this.opts.onChange) {
      const formatted = this.opts.format
        ? formatValue(this._value, this.opts.format, this.opts.mode)
        : undefined;
      this.opts.onChange(this._value, formatted);
    }
  }

  private _emitConfirm(): void {
    this.opts.onConfirm?.(this._value);
  }

  private _showValidationError(message: string): void {
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

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Show the picker (for popover/modal modes).
   */
  show(): this {
    if (!this._open) this._show();
    return this;
  }

  /**
   * Hide the picker.
   */
  hide(): this {
    if (this._open) this._hide();
    return this;
  }

  /**
   * Toggle open/closed.
   */
  toggle(): this {
    if (this._open) this.hide(); else this.show();
    return this;
  }

  /**
   * Programmatically set a new value.
   */
  setValue(value: PickerValue): this {
    this._value = value;
    if (!this.isControlled) {
      const d = value instanceof Date ? value :
        Array.isArray(value) && value[0] instanceof Date ? value[0] as Date : null;
      if (d) { this._viewYear = d.getFullYear(); this._viewMonth = d.getMonth(); }
    }
    this._refresh();
    return this;
  }

  /**
   * Returns the current value.
   */
  getValue(): PickerValue {
    return this._value;
  }

  /**
   * Navigate to a specific month/year.
   */
  navigateTo(year: number, month: number): this {
    this._viewYear = year;
    this._viewMonth = month;
    this._viewMode = "day";
    this._refresh();
    return this;
  }

  /**
   * Update options at runtime (theme, primaryColor, minDate, maxDate, etc.)
   */
  setOptions(partial: Partial<DatePickerOptions>): this {
    if (partial.theme) {
      this.opts.theme = partial.theme;
      if (this._overlayEl) this._overlayEl.dataset.dpTheme = partial.theme;
    }
    if (partial.primaryColor) {
      this.opts.primaryColor = partial.primaryColor;
      this._overlayEl?.style.setProperty("--dp-primary", partial.primaryColor);
    }
    if (partial.minDate !== undefined) this.opts.minDate = partial.minDate ?? null;
    if (partial.maxDate !== undefined) this.opts.maxDate = partial.maxDate ?? null;
    if (partial.disabledDates !== undefined) this.opts.disabledDates = partial.disabledDates ?? null;
    if (partial.open !== undefined) {
      if (partial.open) this.show(); else this.hide();
    }
    this._refresh();
    return this;
  }

  /**
   * Remove picker from DOM and clean up all listeners.
   */
  destroy(): void {
    if (this._boundKeydown) document.removeEventListener("keydown", this._boundKeydown);
    if (this._boundMouseup) window.removeEventListener("mouseup", this._boundMouseup);
    if (this._boundOutsideClick) document.removeEventListener("click", this._boundOutsideClick, true);
    this._stopAutoUpdate?.();
    this._overlayEl?.remove();
    this._overlayEl = null;
    this._panelEl = null;
    this._panels = [];
  }
}
