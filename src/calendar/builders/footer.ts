// calendar/builders/footer.ts — Footer, presets, and time picker builders

import type { DatePicker } from "../DatePicker";
import type { PickerValue } from "../types";

// ── Footer helpers ────────────────────────────────────────────────────────────

export function hasFooter(this: DatePicker): boolean {
  return (
    this.opts.showToday ||
    this.opts.showClear ||
    this.opts.showActions ||
    !!(this.opts.footerButtons?.length) ||
    !!(this.opts.presets?.length)
  );
}

export function buildFooter(this: DatePicker): HTMLElement {
  const footer = document.createElement("div");
  footer.className = "dp-footer";

  if (this.opts.presets && this.opts.presets.length > 0) {
    footer.appendChild(buildPresetsRow.call(this));
  }

  if (this.opts.showToday || this.opts.showClear || this.opts.showActions || this.opts.footerButtons?.length) {
    footer.appendChild(buildMainRow.call(this));
  }

  return footer;
}

function buildPresetsRow(this: DatePicker): HTMLElement {
  const row = document.createElement("div");
  row.className = "dp-presets";

  this.opts.presets!.forEach((preset) => {
    if (preset.isDivider) {
      const div = document.createElement("span");
      div.className = "dp-preset-divider";
      div.textContent = preset.label || "";
      row.appendChild(div);
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dp-btn dp-preset-btn";
    btn.textContent = preset.label;

    const presetVal = typeof preset.value === "function" ? preset.value() : preset.value;
    if (presetVal !== undefined && isPresetActive(presetVal, this._value)) {
      btn.classList.add("dp-preset-btn--active");
    }

    btn.addEventListener("click", () => {
      if (preset.value === undefined) return;
      const val = typeof preset.value === "function" ? preset.value() : preset.value;
      this._value = val;
      if (val instanceof Date) {
        this._viewYear = val.getFullYear();
        this._viewMonth = val.getMonth();
      } else if (Array.isArray(val) && val[0] instanceof Date) {
        this._viewYear = (val[0] as Date).getFullYear();
        this._viewMonth = (val[0] as Date).getMonth();
      }
      this._viewMode = "day";
      this._rangeAnchor = null;
      this._rangeHover = null;
      this._emitChange();
      if (!this.opts.showActions && this.opts.displayMode !== "inline") {
        this._emitConfirm();
        this._hide();
      } else {
        this._refresh();
      }
    });

    row.appendChild(btn);
  });

  return row;
}

function buildMainRow(this: DatePicker): HTMLElement {
  const mainRow = document.createElement("div");
  mainRow.className = "dp-footer-main";

  const left = document.createElement("div");
  left.className = "dp-footer-left";

  if (this.opts.footerButtons?.length) {
    this.opts.footerButtons.forEach((fb) => {
      const btn = document.createElement("button");
      btn.className = `dp-btn dp-btn--ghost${fb.className ? " " + fb.className : ""}`;
      btn.type = "button";
      btn.textContent = fb.label;
      btn.addEventListener("click", () => fb.onClick(this));
      left.appendChild(btn);
    });
  }

  if (this.opts.showToday) {
    const btn = document.createElement("button");
    btn.className = "dp-btn dp-btn--ghost";
    btn.type = "button";
    btn.textContent = "Now";
    btn.setAttribute("aria-label", "Navigate to now");
    btn.addEventListener("click", () => this._goToToday());
    left.appendChild(btn);
  }

  if (this.opts.showClear) {
    const btn = document.createElement("button");
    btn.className = "dp-btn dp-btn--ghost";
    btn.type = "button";
    btn.textContent = "Clear";
    btn.setAttribute("aria-label", "Clear selection");
    btn.addEventListener("click", () => this._clearValue());
    left.appendChild(btn);
  }

  mainRow.appendChild(left);

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

    mainRow.appendChild(right);
  }

  return mainRow;
}

function isPresetActive(presetVal: PickerValue, currentVal: PickerValue): boolean {
  if (presetVal instanceof Date && currentVal instanceof Date) {
    return presetVal.toDateString() === currentVal.toDateString();
  }
  if (Array.isArray(presetVal) && Array.isArray(currentVal)) {
    const [ps, pe] = presetVal as [Date | null, Date | null];
    const [cs, ce] = currentVal as [Date | null, Date | null];
    return (
      ps instanceof Date && cs instanceof Date && ps.toDateString() === cs.toDateString() &&
      pe instanceof Date && ce instanceof Date && pe.toDateString() === ce.toDateString()
    );
  }
  return false;
}

// ── Time Picker ───────────────────────────────────────────────────────────────

export function buildTimePicker(this: DatePicker): HTMLElement {
  const row = document.createElement("div");
  row.className = "dp-time-picker";

  const makeInput = (label: string, value: number, max: number, onChange: (v: number) => void) => {
    const wrap = document.createElement("div");
    wrap.className = "dp-time-unit";

    const lbl = document.createElement("label");
    lbl.className = "dp-time-label";
    lbl.textContent = label;

    const input = document.createElement("input");
    input.type = "number";
    input.className = "dp-time-input";
    input.min = "0";
    input.max = String(max);
    input.value = String(value).padStart(2, "0");
    input.setAttribute("aria-label", label);

    input.addEventListener("input", () => {
      let v = parseInt(input.value, 10);
      if (isNaN(v)) return;
      if (v > max) {
        v = max;
        input.value = String(v); // wait for blur to pad
      }
      onChange(v);
      if (this._value instanceof Date) {
        this._value.setHours(this._selectedHour, this._selectedMinute, this._selectedSecond, 0);
        this._emitChange();
      }
    });

    input.addEventListener("change", () => {
      const v = Math.max(0, Math.min(max, parseInt(input.value, 10) || 0));
      input.value = String(v).padStart(2, "0");
      onChange(v);
      if (this._value instanceof Date) {
        this._value.setHours(this._selectedHour, this._selectedMinute, this._selectedSecond, 0);
        this._emitChange();
      }
    });

    wrap.appendChild(lbl);
    wrap.appendChild(input);
    return wrap;
  };

  const makeSep = () => {
    const s = document.createElement("span");
    s.className = "dp-time-separator";
    s.textContent = ":";
    return s;
  };

  row.appendChild(makeInput("Hour", this._selectedHour, 23, (v) => { this._selectedHour = v; }));
  row.appendChild(makeSep());
  row.appendChild(makeInput("Min", this._selectedMinute, 59, (v) => { this._selectedMinute = v; }));

  if (this.opts.showSeconds || this.opts.mode === "datetime-seconds") {
    row.appendChild(makeSep());
    row.appendChild(makeInput("Sec", this._selectedSecond, 59, (v) => { this._selectedSecond = v; }));
  }

  return row;
}
