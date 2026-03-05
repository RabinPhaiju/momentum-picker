// ─────────────────────────────────────────────────────────────────────────────
// MomentumPicker.ts — Main orchestrator class.
//
// Responsibilities:
//   • Parse and validate PickerOptions (fill defaults)
//   • Build ColumnDef arrays based on mode (date / time / datetime)
//   • Instantiate WheelColumn instances
//   • Render the overlay + sheet chrome (header, columns, selection band)
//   • Synchronise column changes into an internal Date value
//   • Re-build day column when month/year changes (days-in-month)
//   • Forward onChange / onConfirm / onCancel
//   • Provide a clean public API: show/hide/destroy/getValue/setValue
// ─────────────────────────────────────────────────────────────────────────────

import "./styles/wheel.css";

import type {
  PickerOptions,
  ResolvedOptions,
  ColumnDef,
  ColumnItem,
} from "./types";
import { WheelColumn } from "./WheelColumn";
import {
  getDaysInMonth,
  generateRange,
  padZero,
  formatDate,
  getMonthNames,
  cloneDate,
  clamp,
} from "./utils";

// ── Year range ─────────────────────────────────────────────────────────────────
const DEFAULT_MIN_YEAR = 1924;
const DEFAULT_MAX_YEAR = 2124;

// ─────────────────────────────────────────────────────────────────────────────

export class MomentumPicker {
  // ── Config ──────────────────────────────────────────────────────────────────
  private opts: ResolvedOptions;
  private containerEl: HTMLElement;

  // ── Internal date state ─────────────────────────────────────────────────────
  private _value: Date;

  // ── DOM ─────────────────────────────────────────────────────────────────────
  private overlay: HTMLDivElement | null = null;
  private sheet: HTMLDivElement | null = null;
  private columnsEl: HTMLDivElement | null = null;

  // ── Columns ─────────────────────────────────────────────────────────────────
  private columns: Map<string, WheelColumn> = new Map();

  // ─────────────────────────────────────────────────────────────────────────────

  constructor(options: PickerOptions) {
    this.opts = this.resolveOptions(options);
    this.containerEl = this.resolveContainer(options.container);
    this._value = cloneDate(this.opts.value);

    this.render();
  }

  // ── Option Resolution ────────────────────────────────────────────────────────

  private resolveOptions(opts: PickerOptions): ResolvedOptions {
    return {
      mode: opts.mode ?? "datetime",
      value: opts.value instanceof Date ? opts.value : new Date(),
      minDate: opts.minDate ?? null,
      maxDate: opts.maxDate ?? null,
      minuteStep: opts.minuteStep ?? 1,
      format: opts.format ?? null,
      locale: opts.locale ?? navigator.language ?? "en-US",
      theme: opts.theme ?? "light",
      primaryColor: opts.primaryColor ?? "#007aff",
      itemHeight: opts.itemHeight ?? 44,
      visibleRows: opts.visibleRows ?? 5,
      onChange: opts.onChange,
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    };
  }

  // ── Container Resolution ────────────────────────────────────────────────────

  private resolveContainer(container: string | HTMLElement): HTMLElement {
    if (typeof container === "string") {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) throw new Error(`[MomentumPicker] Container "${container}" not found`);
      return el;
    }
    return container;
  }

  // ── Column Data Builders ────────────────────────────────────────────────────

  private buildYearItems(): ColumnItem[] {
    const minY = this.opts.minDate?.getFullYear() ?? DEFAULT_MIN_YEAR;
    const maxY = this.opts.maxDate?.getFullYear() ?? DEFAULT_MAX_YEAR;
    return generateRange(minY, maxY).map((y) => ({ label: String(y), value: y }));
  }

  private buildMonthItems(): ColumnItem[] {
    const names = getMonthNames(this.opts.locale);
    return names.map((name, i) => ({ label: name, value: i }));
  }

  private buildDayItems(year: number, month: number): ColumnItem[] {
    const days = getDaysInMonth(year, month);
    return generateRange(1, days).map((d) => ({
      label: padZero(d),
      value: d,
    }));
  }

  private buildHourItems(): ColumnItem[] {
    return generateRange(0, 23).map((h) => ({
      label: padZero(h),
      value: h,
    }));
  }

  private buildMinuteItems(): ColumnItem[] {
    const step = this.opts.minuteStep;
    return generateRange(0, 59, step).map((m) => ({
      label: padZero(m),
      value: m,
    }));
  }

  // ── Column Def Builders ────────────────────────────────────────────────────

  private buildColumnDefs(): ColumnDef[] {
    const v = this._value;
    const defs: ColumnDef[] = [];
    const { mode } = this.opts;

    if (mode === "date" || mode === "datetime") {
      // Year
      const yearItems = this.buildYearItems();
      const yearIdx = yearItems.findIndex((i) => i.value === v.getFullYear());
      defs.push({
        key: "year",
        ariaLabel: "Year",
        items: yearItems,
        selectedIndex: clamp(yearIdx, 0, yearItems.length - 1),
        onSelect: (idx) => this.handleColumnSelect("year", idx),
      });

      // Month
      const monthItems = this.buildMonthItems();
      defs.push({
        key: "month",
        ariaLabel: "Month",
        items: monthItems,
        selectedIndex: v.getMonth(),
        onSelect: (idx) => this.handleColumnSelect("month", idx),
      });

      // Day
      const dayItems = this.buildDayItems(v.getFullYear(), v.getMonth());
      const dayIdx = Math.min(v.getDate() - 1, dayItems.length - 1);
      defs.push({
        key: "day",
        ariaLabel: "Day",
        items: dayItems,
        selectedIndex: dayIdx,
        onSelect: (idx) => this.handleColumnSelect("day", idx),
      });
    }

    if (mode === "time" || mode === "datetime") {
      // Hour
      defs.push({
        key: "hour",
        ariaLabel: "Hour",
        items: this.buildHourItems(),
        selectedIndex: v.getHours(),
        onSelect: (idx) => this.handleColumnSelect("hour", idx),
      });

      // Minute
      const minuteItems = this.buildMinuteItems();
      const step = this.opts.minuteStep;
      const snappedMinute = Math.round(v.getMinutes() / step) * step;
      const minuteIdx = minuteItems.findIndex((i) => i.value === snappedMinute);
      defs.push({
        key: "minute",
        ariaLabel: "Minute",
        items: minuteItems,
        selectedIndex: clamp(minuteIdx, 0, minuteItems.length - 1),
        onSelect: (idx) => this.handleColumnSelect("minute", idx),
      });
    }

    return defs;
  }

  // ── Column Change Handler ────────────────────────────────────────────────────

  private handleColumnSelect(
    key: ColumnDef["key"],
    index: number,
  ): void {
    const col = this.columns.get(key);
    if (!col) return;
    const value = col.getValue();

    switch (key) {
      case "year": {
        // Clamp day before changing year to avoid JS Date rollover
        // e.g. Feb 29 on leap year → non-leap year would roll to Mar 1
        const newYear = value;
        const maxDayForYear = getDaysInMonth(newYear, this._value.getMonth());
        this._value.setDate(Math.min(this._value.getDate(), maxDayForYear));
        this._value.setFullYear(newYear);
        this.refreshDayColumn();
        break;
      }
      case "month": {
        // Clamp day before changing month to prevent JS Date rollover
        // e.g. Jan 31 → Feb would roll over to Mar 2/3
        const newMonth = value;
        const maxDayForMonth = getDaysInMonth(this._value.getFullYear(), newMonth);
        this._value.setDate(Math.min(this._value.getDate(), maxDayForMonth));
        this._value.setMonth(newMonth);
        this.refreshDayColumn();
        break;
      }
      case "day":
        this._value.setDate(value);
        break;
      case "hour":
        this._value.setHours(value);
        break;
      case "minute":
        this._value.setMinutes(value);
        break;
    }

    void index; // suppress unused param lint for now

    this.emitChange();
  }

  /**
   * When year or month changes, the days column must be rebuilt
   * because months have different lengths.
   */
  private refreshDayColumn(): void {
    const dayCol = this.columns.get("day");
    if (!dayCol) return;

    const y = this._value.getFullYear();
    const m = this._value.getMonth();
    const newDayItems = this.buildDayItems(y, m);
    const maxDay = newDayItems.length;

    // Clamp the current day to the new maximum
    const currentDay = clamp(this._value.getDate(), 1, maxDay);
    this._value.setDate(currentDay);
    const newDayIdx = currentDay - 1;

    dayCol.updateItems(newDayItems, newDayIdx);
  }

  // ── Event Emitters ──────────────────────────────────────────────────────────

  private emitChange(): void {
    const date = cloneDate(this._value);
    const formatted = this.opts.format
      ? formatDate(date, this.opts.format, this.opts.locale)
      : undefined;
    this.opts.onChange?.(date, formatted);
  }

  private emitConfirm(): void {
    const date = cloneDate(this._value);
    const formatted = this.opts.format
      ? formatDate(date, this.opts.format, this.opts.locale)
      : undefined;
    this.opts.onConfirm?.(date, formatted);
  }

  // ── DOM Rendering ───────────────────────────────────────────────────────────

  private render(): void {
    const container = this.containerEl;

    // ── Overlay (backdrop) ──────────────────────────────────────────────────
    this.overlay = document.createElement("div");
    this.overlay.className = "mp-overlay";
    this.overlay.setAttribute("role", "dialog");
    this.overlay.setAttribute("aria-modal", "true");
    this.overlay.setAttribute("aria-label", "Date Time Picker");
    this.overlay.dataset.mpTheme = this.opts.theme;

    // Close on backdrop click
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.opts.onCancel?.();
        this.hide();
      }
    });

    // ── Sheet ───────────────────────────────────────────────────────────────
    this.sheet = document.createElement("div");
    this.sheet.className = "mp-sheet";

    // Apply CSS custom properties
    this.applyCustomProperties(this.sheet);

    // ── Header ──────────────────────────────────────────────────────────────
    const header = document.createElement("div");
    header.className = "mp-header";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "mp-btn mp-btn-cancel";
    cancelBtn.textContent = "Cancel";
    cancelBtn.setAttribute("aria-label", "Cancel date selection");
    cancelBtn.addEventListener("click", () => {
      this.opts.onCancel?.();
      this.hide();
    });

    const title = document.createElement("div");
    title.className = "mp-header-title";
    title.textContent = this.getTitleByMode();

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "mp-btn mp-btn-confirm";
    confirmBtn.textContent = "Done";
    confirmBtn.setAttribute("aria-label", "Confirm date selection");
    confirmBtn.addEventListener("click", () => {
      this.emitConfirm();
      this.hide();
    });

    header.appendChild(cancelBtn);
    header.appendChild(title);
    header.appendChild(confirmBtn);

    // ── Columns container ───────────────────────────────────────────────────
    this.columnsEl = document.createElement("div");
    this.columnsEl.className = "mp-columns";

    // Apply CSS variable for item height and visible rows
    this.columnsEl.style.setProperty(
      "--mp-item-height",
      `${this.opts.itemHeight}px`,
    );
    this.columnsEl.style.setProperty(
      "--mp-visible-rows",
      String(this.opts.visibleRows),
    );

    // Selection indicator band (the "highlight" row in the middle)
    const selectionBand = document.createElement("div");
    selectionBand.className = "mp-selection-band";
    selectionBand.setAttribute("aria-hidden", "true");

    this.columnsEl.appendChild(selectionBand);

    // ── Instantiate columns ─────────────────────────────────────────────────
    const defs = this.buildColumnDefs();
    defs.forEach((def) => {
      const col = new WheelColumn(def, this.opts.itemHeight, this.opts.visibleRows);
      this.columns.set(def.key, col);
      this.columnsEl!.appendChild(col.el);
    });

    // ── Assemble ────────────────────────────────────────────────────────────
    this.sheet.appendChild(header);
    this.sheet.appendChild(this.columnsEl);
    this.overlay.appendChild(this.sheet);
    container.appendChild(this.overlay);

    // ── Keyboard: close on Escape ───────────────────────────────────────────
    document.addEventListener("keydown", this.handleGlobalKeydown.bind(this));
  }

  private applyCustomProperties(el: HTMLElement): void {
    el.style.setProperty("--mp-primary", this.opts.primaryColor);
    el.style.setProperty("--mp-item-height", `${this.opts.itemHeight}px`);
    el.style.setProperty("--mp-visible-rows", String(this.opts.visibleRows));
  }

  private getTitleByMode(): string {
    switch (this.opts.mode) {
      case "date": return "Select Date";
      case "time": return "Select Time";
      default: return "Select Date & Time";
    }
  }

  private handleGlobalKeydown(e: KeyboardEvent): void {
    if (!this.overlay?.classList.contains("mp-visible")) return;
    if (e.key === "Escape") {
      this.opts.onCancel?.();
      this.hide();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Display the picker (slide-up animation).
   */
  show(): this {
    this.overlay?.classList.add("mp-visible");
    // Shift focus into the sheet for accessibility
    setTimeout(() => {
      const firstCol = this.columnsEl?.querySelector<HTMLElement>(".mp-column");
      firstCol?.focus();
    }, 250); // after transition
    return this;
  }

  /**
   * Hide the picker (slide-down animation).
   */
  hide(): this {
    this.overlay?.classList.remove("mp-visible");
    return this;
  }

  /**
   * Toggle visibility.
   */
  toggle(): this {
    if (this.overlay?.classList.contains("mp-visible")) {
      this.hide();
    } else {
      this.show();
    }
    return this;
  }

  /**
   * Programmatically set a new date value, syncing all wheel columns.
   */
  setValue(date: Date): this {
    this._value = cloneDate(date);

    const v = this._value;
    const { mode, minuteStep, itemHeight, visibleRows } = this.opts;

    if (mode === "date" || mode === "datetime") {
      // Year
      const yearCol = this.columns.get("year");
      if (yearCol) {
        const yearItems = this.buildYearItems();
        const idx = yearItems.findIndex((i) => i.value === v.getFullYear());
        yearCol.scrollToIndex(clamp(idx, 0, yearItems.length - 1), false);
      }

      // Month
      const monthCol = this.columns.get("month");
      monthCol?.scrollToIndex(v.getMonth(), false);

      // Day
      const dayCol = this.columns.get("day");
      if (dayCol) {
        const dayItems = this.buildDayItems(v.getFullYear(), v.getMonth());
        dayCol.updateItems(dayItems, Math.min(v.getDate() - 1, dayItems.length - 1));
      }
    }

    if (mode === "time" || mode === "datetime") {
      this.columns.get("hour")?.scrollToIndex(v.getHours(), false);

      const step = minuteStep;
      const snappedMin = Math.round(v.getMinutes() / step) * step;
      const minuteItems = this.buildMinuteItems();
      const minuteIdx = minuteItems.findIndex((i) => i.value === snappedMin);
      this.columns
        .get("minute")
        ?.scrollToIndex(clamp(minuteIdx, 0, minuteItems.length - 1), false);
    }

    void itemHeight; void visibleRows; // reserved
    return this;
  }

  /**
   * Returns a clone of the currently selected Date.
   */
  getValue(): Date {
    return cloneDate(this._value);
  }

  /**
   * Returns the formatted string if `format` was specified, otherwise null.
   */
  getFormattedValue(): string | null {
    if (!this.opts.format) return null;
    return formatDate(this._value, this.opts.format, this.opts.locale);
  }

  /**
   * Update specific options after construction (e.g. switch theme).
   */
  setOptions(partial: Partial<PickerOptions>): this {
    if (partial.theme) {
      this.opts.theme = partial.theme;
      if (this.overlay) this.overlay.dataset.mpTheme = partial.theme;
    }
    if (partial.primaryColor) {
      this.opts.primaryColor = partial.primaryColor;
      if (this.sheet) this.applyCustomProperties(this.sheet);
    }
    return this;
  }

  /**
   * Remove the picker from the DOM and clean up all listeners.
   */
  destroy(): void {
    document.removeEventListener("keydown", this.handleGlobalKeydown.bind(this));
    this.columns.forEach((col) => col.destroy());
    this.columns.clear();
    this.overlay?.remove();
    this.overlay = null;
    this.sheet = null;
    this.columnsEl = null;
  }
}
