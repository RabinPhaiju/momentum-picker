// MomentumPicker.ts — Slim orchestrator (uses wheel/ sub-modules)

import "./styles/wheel.css";

import { createAutoUpdater } from "./calendar/positioning";
import type { PopoverPlacement } from "./calendar/positioning";
import type { PickerOptions, ResolvedOptions, ColumnDef } from "./types";
import { WheelColumn } from "./WheelColumn";
import { cloneDate, formatDate } from "./utils";
import {
  buildColumnDefs,
  buildYearItems,
  buildMonthItems,
  buildDayItems,
  buildMinuteItems,
} from "./wheel/column-data";
import { buildOverlay, buildSheet, buildHeader, buildColumnsEl } from "./wheel/render";
import { getDaysInMonth, clamp } from "./utils";

export class MomentumPicker {
  private opts: ResolvedOptions;
  private containerEl: HTMLElement;
  private _value: Date;

  private overlay: HTMLDivElement | null = null;
  private sheet: HTMLDivElement | null = null;
  private columnsEl: HTMLDivElement | null = null;
  private anchorEl: HTMLElement | null = null;
  private _stopAutoUpdate: (() => void) | null = null;
  private _boundOutsideClick: ((e: MouseEvent) => void) | null = null;
  private columns: Map<string, WheelColumn> = new Map();

  constructor(options: PickerOptions) {
    this.opts = this._resolveOptions(options);
    if (this.opts.displayMode === "popover" && options.anchor) {
      this.anchorEl = this._resolveEl(options.anchor);
      this.containerEl = document.body;
    } else {
      this.containerEl = this._resolveEl(options.container || document.body);
    }
    this._value = cloneDate(this.opts.value);
    this._render();
  }

  private _resolveOptions(opts: PickerOptions): ResolvedOptions {
    return {
      displayMode: opts.displayMode ?? "modal",
      mode: opts.mode ?? "datetime",
      value: opts.value instanceof Date ? opts.value : new Date(),
      minDate: opts.minDate ?? null,
      maxDate: opts.maxDate ?? null,
      minuteStep: opts.minuteStep ?? 1,
      format: opts.format ?? null,
      locale: opts.locale ?? navigator.language ?? "en-US",
      theme: opts.theme ?? "light",
      style: opts.style ?? "default",
      primaryColor: opts.primaryColor ?? "#007aff",
      itemHeight: opts.itemHeight ?? 44,
      visibleRows: opts.visibleRows ?? 5,
      width: opts.width ?? "100%",
      is3D: opts.is3D ?? true,
      onChange: opts.onChange,
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    };
  }

  private _resolveEl(el: string | HTMLElement): HTMLElement {
    if (typeof el === "string") {
      const found = document.querySelector<HTMLElement>(el);
      if (!found) throw new Error(`[MomentumPicker] Element "${el}" not found`);
      return found;
    }
    return el;
  }

  private _render(): void {
    if (this.opts.displayMode === "modal") {
      this.overlay = buildOverlay(this.opts, () => { this.opts.onCancel?.(); this.hide(); });
    }
    this.sheet = buildSheet(this.opts);

    if (this.opts.displayMode !== "inline") {
      this.sheet.appendChild(buildHeader(this.opts,
        () => { this.opts.onCancel?.(); this.hide(); },
        () => { this._emitConfirm(); this.hide(); },
      ));
    }

    this.columnsEl = buildColumnsEl(
      buildColumnDefs(this.opts, this._value, (key, idx) => this._onColumnSelect(key, idx)),
      this.opts,
      WheelColumn as unknown as new (...args: unknown[]) => WheelColumn,
      this.columns,
    );
    this.sheet.appendChild(this.columnsEl);

    if (this.opts.displayMode === "modal" && this.overlay) {
      this.overlay.appendChild(this.sheet);
      this.containerEl.appendChild(this.overlay);
    } else {
      this.containerEl.appendChild(this.sheet);
    }

    document.addEventListener("keydown", this._onKeydown.bind(this));
  }

  private _onColumnSelect(key: ColumnDef["key"], _index: number): void {
    const col = this.columns.get(key);
    if (!col) return;
    const value = col.getValue();

    if (key === "year") {
      const maxDay = getDaysInMonth(value, this._value.getMonth());
      this._value.setDate(Math.min(this._value.getDate(), maxDay));
      this._value.setFullYear(value);
      this._refreshDayColumn();
    } else if (key === "month") {
      const maxDay = getDaysInMonth(this._value.getFullYear(), value);
      this._value.setDate(Math.min(this._value.getDate(), maxDay));
      this._value.setMonth(value);
      this._refreshDayColumn();
    } else if (key === "day") {
      this._value.setDate(value);
    } else if (key === "hour") {
      this._value.setHours(value);
    } else if (key === "minute") {
      this._value.setMinutes(value);
    }

    this._emitChange();
  }

  private _refreshDayColumn(): void {
    const dayCol = this.columns.get("day");
    if (!dayCol) return;
    const newItems = buildDayItems(this._value.getFullYear(), this._value.getMonth());
    const currentDay = clamp(this._value.getDate(), 1, newItems.length);
    this._value.setDate(currentDay);
    dayCol.updateItems(newItems, currentDay - 1);
  }

  private _emitChange(): void {
    const date = cloneDate(this._value);
    const formatted = this.opts.format ? formatDate(date, this.opts.format, this.opts.locale) : undefined;
    this.opts.onChange?.(date, formatted);
  }

  private _emitConfirm(): void {
    const date = cloneDate(this._value);
    const formatted = this.opts.format ? formatDate(date, this.opts.format, this.opts.locale) : undefined;
    this.opts.onConfirm?.(date, formatted);
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (this.opts.displayMode === "inline") return;
    const isVisible = this.opts.displayMode === "modal"
      ? this.overlay?.classList.contains("mp-visible")
      : this.sheet?.classList.contains("mp-visible");
    if (!isVisible) return;
    if (e.key === "Escape") { this.opts.onCancel?.(); this.hide(); }
  }

  private _onOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (this.sheet?.contains(target) || this.anchorEl?.contains(target)) return;
    this.opts.onCancel?.();
    this.hide();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  show(): this {
    if (this.opts.displayMode === "modal" && this.overlay) {
      this.overlay.classList.add("mp-visible");
    } else if (this.opts.displayMode === "popover" && this.sheet && this.anchorEl) {
      this.sheet.style.display = "block";
      this._stopAutoUpdate = createAutoUpdater(
        this.anchorEl, this.sheet,
        ({ top, left }) => { this.sheet!.style.top = `${top}px`; this.sheet!.style.left = `${left}px`; },
        "bottom-start" as PopoverPlacement,
      );
      requestAnimationFrame(() => requestAnimationFrame(() => this.sheet!.classList.add("mp-visible")));
      if (!this._boundOutsideClick) {
        this._boundOutsideClick = this._onOutsideClick.bind(this);
        setTimeout(() => document.addEventListener("click", this._boundOutsideClick!), 0);
      }
    }
    setTimeout(() => this.columnsEl?.querySelector<HTMLElement>(".mp-column")?.focus(), 250);
    return this;
  }

  hide(): this {
    if (this.opts.displayMode === "modal" && this.overlay) {
      this.overlay.classList.remove("mp-visible");
    } else if (this.opts.displayMode === "popover" && this.sheet) {
      this.sheet.classList.remove("mp-visible");
      setTimeout(() => { if (!this.sheet?.classList.contains("mp-visible")) this.sheet!.style.display = "none"; }, 400);
      this._stopAutoUpdate?.(); this._stopAutoUpdate = null;
      if (this._boundOutsideClick) { document.removeEventListener("click", this._boundOutsideClick); this._boundOutsideClick = null; }
    }
    return this;
  }

  toggle(): this {
    const isVisible = this.opts.displayMode === "modal"
      ? this.overlay?.classList.contains("mp-visible")
      : this.sheet?.classList.contains("mp-visible");
    return isVisible ? this.hide() : this.show();
  }

  setValue(date: Date): this {
    this._value = cloneDate(date);
    const v = this._value;
    const { mode, minuteStep } = this.opts;
    if (mode === "date" || mode === "datetime") {
      const yearItems = buildYearItems(this.opts);
      const yi = yearItems.findIndex((i) => i.value === v.getFullYear());
      this.columns.get("year")?.scrollToIndex(clamp(yi, 0, yearItems.length - 1), false);
      this.columns.get("month")?.scrollToIndex(v.getMonth(), false);
      const dayItems = buildDayItems(v.getFullYear(), v.getMonth());
      this.columns.get("day")?.updateItems(dayItems, Math.min(v.getDate() - 1, dayItems.length - 1));
    }
    if (mode === "time" || mode === "datetime") {
      this.columns.get("hour")?.scrollToIndex(v.getHours(), false);
      const minuteItems = buildMinuteItems(this.opts);
      const snapped = Math.round(v.getMinutes() / minuteStep) * minuteStep;
      const mi = minuteItems.findIndex((i) => i.value === snapped);
      this.columns.get("minute")?.scrollToIndex(clamp(mi, 0, minuteItems.length - 1), false);
    }
    return this;
  }

  getValue(): Date { return cloneDate(this._value); }

  getFormattedValue(): string | null {
    return this.opts.format ? formatDate(this._value, this.opts.format, this.opts.locale) : null;
  }

  setOptions(partial: Partial<PickerOptions>): this {
    if (partial.theme) {
      this.opts.theme = partial.theme;
      if (this.overlay) this.overlay.dataset.mpTheme = partial.theme;
      if (this.sheet) this.sheet.dataset.mpTheme = partial.theme;
    }
    if (partial.style) {
      this.opts.style = partial.style;
      if (this.overlay) this.overlay.dataset.mpStyle = partial.style;
      if (this.sheet) this.sheet.dataset.mpStyle = partial.style;
    }
    if (partial.primaryColor && this.sheet) {
      this.opts.primaryColor = partial.primaryColor;
      this.sheet.style.setProperty("--mp-primary", partial.primaryColor);
    }
    if (partial.is3D !== undefined) {
      this.opts.is3D = partial.is3D;
      this.columns.forEach((col) => col.setIs3D(partial.is3D!));
    }
    return this;
  }

  destroy(): void {
    this.columns.forEach((col) => col.destroy());
    this.columns.clear();
    this.overlay?.remove();
    this.overlay = null;
    this.sheet = null;
    this.columnsEl = null;
  }
}
