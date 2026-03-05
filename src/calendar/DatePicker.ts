// ─────────────────────────────────────────────────────────────────────────────
// DatePicker — Main class
//
// Orchestrates state, mounts the DOM, and exposes the public API.
// DOM-building logic lives in ./builders.ts
// Event-handling / selection logic lives in ./handlers.ts
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
  FooterButton,
  DatePreset,
} from "./types";

// ── Builder methods ─────────────────────────────────────────────────────────
import {
  buildPanel,
  renderPanelContent,
  buildHeader,
  buildWeekdays,
  buildGrid,
  buildDayCell,
  buildDefaultDayCell,
  buildMonthPanel,
  buildYearPanel,
  hasFooter,
  buildFooter,
  buildTimePicker,
} from "./builders";

// ── Handler methods ─────────────────────────────────────────────────────────
import {
  handleDayClick,
  selectDate,
  navigatePrev,
  navigateNext,
  goToToday,
  clearValue,
  show as showFn,
  hide as hideFn,
  handleGlobalKeydown,
  moveFocus,
  handleGlobalMouseup,
  handleOutsideClick,
  handleCancel,
  handleConfirm,
  emitChange,
  emitConfirm,
  showValidationError,
  handleTouchStart,
  handleTouchEnd,
  handlePaste,
} from "./handlers";

// ─────────────────────────────────────────────────────────────────────────────

export class DatePicker {
  // ── Options ────────────────────────────────────────────────────────────────
  opts: ResolvedDPOptions;
  private isControlled: boolean;

  // ── Internal state ─────────────────────────────────────────────────────────
  _value: PickerValue;
  _open: boolean;
  _viewYear: number;
  _viewMonth: number;
  _viewMode: ViewMode = "day";

  // Range-drag tracking
  _rangeAnchor: Date | null = null;
  _rangeHover: Date | null = null;
  _isDragging = false;

  // Year panel: current decade start
  _decadeStart: number;

  // Time picker state
  _selectedHour = 0;
  _selectedMinute = 0;
  _selectedSecond = 0;

  // Touch/swipe tracking
  _touchStartX = 0;
  _touchStartY = 0;

  // ── DOM roots ──────────────────────────────────────────────────────────────
  _containerEl: HTMLElement | null = null;
  _anchorEl: HTMLElement | null = null;
  _overlayEl: HTMLDivElement | null = null;
  _panelEl: HTMLDivElement | null = null;

  // Cleanup functions
  _stopAutoUpdate: (() => void) | null = null;
  private _stopAutoUpdateFn: (() => void) | null = null;
  private _boundKeydown: ((e: KeyboardEvent) => void) | null = null;
  private _boundMouseup: ((e: MouseEvent) => void) | null = null;
  private _boundOutsideClick: ((e: MouseEvent) => void) | null = null;
  private _boundPaste: ((e: ClipboardEvent) => void) | null = null;

  _focusedCellDate: Date | null = null;



  // ─────────────────────────────────────────────────────────────────────────

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

  // ── Option Resolution ─────────────────────────────────────────────────────

  private _resolveOptions(opts: DatePickerOptions): ResolvedDPOptions {
    const isDatetimeSeconds = opts.mode === "datetime-seconds";
    return {
      displayMode: opts.displayMode ?? "inline",
      mode: opts.mode ?? "single",
      numberOfMonths: opts.numberOfMonths ?? 1,
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
      footerButtons: opts.footerButtons ?? null,
      presets: opts.presets ?? null,
      footerPosition: opts.footerPosition ?? "bottom",
      showTimePicker: opts.showTimePicker ?? isDatetimeSeconds,
      showSeconds: opts.showSeconds ?? isDatetimeSeconds,
      allowPaste: opts.allowPaste ?? false,
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

  // ── Mount ─────────────────────────────────────────────────────────────────

  private _mount(): void {
    const { displayMode } = this.opts;

    this._overlayEl = document.createElement("div");
    this._overlayEl.className = "dp-root";
    this._overlayEl.dataset.dpTheme = this.opts.theme;
    if (this.opts.className) {
      this.opts.className.split(" ").filter(Boolean).forEach((c) => this._overlayEl!.classList.add(c));
    }

    if (displayMode === "inline") {
      // Render directly inside container
      const panel = this._buildPanel("dp-panel--inline");
      this._panelEl = panel;
      this._overlayEl.appendChild(panel);
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

    if (this.opts.primaryColor !== "#007aff" && this._panelEl) {
      this._panelEl.style.setProperty("--dp-primary", this.opts.primaryColor);
    }

    // Clipboard paste detection
    if (this.opts.allowPaste) {
      this._boundPaste = this._handlePaste.bind(this);
      if (this._boundPaste) document.addEventListener("paste", this._boundPaste);
    }

    // Touch swipe gestures — attached after panel is created
    // (done in _show / after mount so panel exists)
    this._attachTouchListeners();
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  _refresh(): void {
    const panel = this._getPanel();
    if (panel) this._renderPanelContent(panel);
  }

  _getPanel(): HTMLDivElement | null {
    if (this.opts.displayMode === "inline") {
      return this._overlayEl?.querySelector<HTMLDivElement>(".dp-panel") ?? null;
    }
    return this._panelEl;
  }

  // ── Builder methods (from ./builders.ts) ───────────────────────────────────
  _buildPanel = buildPanel;
  _renderPanelContent = renderPanelContent;
  _buildHeader = buildHeader;
  _buildWeekdays = buildWeekdays;
  _buildGrid = buildGrid;
  _buildDayCell = buildDayCell;
  _buildDefaultDayCell = buildDefaultDayCell;
  _buildMonthPanel = buildMonthPanel;
  _buildYearPanel = buildYearPanel;
  _hasFooter = hasFooter;
  _buildFooter = buildFooter;
  _buildTimePicker = buildTimePicker;

  // ── Handler methods (from ./handlers.ts) ───────────────────────────────────
  _handleDayClick = handleDayClick;
  _selectDate = selectDate;
  _navigatePrev = navigatePrev;
  _navigateNext = navigateNext;
  _goToToday = goToToday;
  _clearValue = clearValue;
  _show = showFn;
  _hide = hideFn;
  _handleGlobalKeydown = handleGlobalKeydown;
  _moveFocus = moveFocus;
  _handleGlobalMouseup = handleGlobalMouseup;
  _handleOutsideClick = handleOutsideClick;
  _handleCancel = handleCancel;
  _handleConfirm = handleConfirm;
  _emitChange = emitChange;
  _emitConfirm = emitConfirm;
  _showValidationError = showValidationError;
  _handleTouchStart = handleTouchStart;
  _handleTouchEnd = handleTouchEnd;
  _handlePaste = handlePaste;

  // ── Touch listener attachment ──────────────────────────────────────────────
  _attachTouchListeners(): void {
    const panel = this._getPanel();
    if (!panel) return;
    panel.addEventListener("touchstart", (e: TouchEvent) => this._handleTouchStart(e), { passive: true });
    panel.addEventListener("touchend", (e: TouchEvent) => this._handleTouchEnd(e), { passive: true });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Show the picker (for popover/modal modes). */
  show(): this {
    if (!this._open) this._show();
    return this;
  }

  /** Hide the picker. */
  hide(): this {
    if (this._open) this._hide();
    return this;
  }

  /** Toggle open/closed. */
  toggle(): this {
    if (this._open) this.hide(); else this.show();
    return this;
  }

  /** Programmatically set a new value. */
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

  /** Returns the current value. */
  getValue(): PickerValue {
    return this._value;
  }

  /** Navigate to a specific month/year. */
  navigateTo(year: number, month: number): this {
    this._viewYear = year;
    this._viewMonth = month;
    this._viewMode = "day";
    this._refresh();
    return this;
  }

  /** Update options at runtime (theme, primaryColor, minDate, maxDate, etc.) */
  setOptions(partial: Partial<DatePickerOptions>): this {
    if (partial.theme) {
      this.opts.theme = partial.theme;
      if (this._overlayEl) this._overlayEl.dataset.dpTheme = partial.theme;
    }
    if (partial.primaryColor) {
      this.opts.primaryColor = partial.primaryColor;
      this._panelEl?.style.setProperty("--dp-primary", partial.primaryColor);
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

  /** Remove picker from DOM and clean up all listeners. */
  destroy(): void {
    if (this._boundKeydown) document.removeEventListener("keydown", this._boundKeydown);
    if (this._boundMouseup) window.removeEventListener("mouseup", this._boundMouseup);
    if (this._boundOutsideClick) document.removeEventListener("click", this._boundOutsideClick, true);
    if (this._boundPaste) document.removeEventListener("paste", this._boundPaste);
    this._stopAutoUpdate?.();
    this._overlayEl?.remove();
    this._overlayEl = null;
    this._panelEl = null;
  }
}
