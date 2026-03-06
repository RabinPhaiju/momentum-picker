// calendar/builders/month-year.ts — Month panel and year panel builders

import type { DatePicker } from "../DatePicker";
import { getMonthNames } from "../utils";

// ── Month Panel ──────────────────────────────────────────────────────────────

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
    const isDisabledMonth =
      (this.opts.minDate !== null && new Date(this._viewYear, i + 1, 0) < this.opts.minDate!) ||
      (this.opts.maxDate !== null && new Date(this._viewYear, i, 1) > this.opts.maxDate!);

    const btn = document.createElement("div");
    btn.className = "dp-panel-item";
    btn.setAttribute("role", "button");
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

// ── Year Panel ───────────────────────────────────────────────────────────────

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

    const btn = document.createElement("div");
    btn.className = "dp-panel-item";
    btn.setAttribute("role", "button");
    if (isSelectedYear) btn.classList.add("dp-panel-item--selected");
    if (isTodayYear) btn.classList.add("dp-panel-item--today");
    if (isDisabledYear) btn.classList.add("dp-panel-item--disabled");
    if (isOutOfDecade) { btn.style.opacity = "0.35"; btn.style.fontSize = "12px"; }
    btn.textContent = String(year);
    btn.setAttribute("role", "gridcell");
    btn.setAttribute("aria-label", `Year ${year}`);
    btn.setAttribute("aria-selected", String(isSelectedYear));

    btn.addEventListener("click", () => {
      if (this.opts.mode === "year") {
        this._selectDate(new Date(year, 0, 1));
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
