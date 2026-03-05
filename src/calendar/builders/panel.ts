// calendar/builders/panel.ts — Panel, header and weekday builders

import type { DatePicker } from "../DatePicker";
import {
  getMonthNames,
  getDayNames,
} from "../utils";

// ── Panel ────────────────────────────────────────────────────────────────────

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
  const totalMonth = this._viewMonth + monthOffset;
  const panelYear = this._viewYear + Math.floor(totalMonth / 12);
  const panelMonth = ((totalMonth % 12) + 12) % 12;

  const footerOnTop = this.opts.footerPosition === "top";

  if (footerOnTop && this._hasFooter()) {
    panel.appendChild(this._buildFooter());
  }

  panel.appendChild(this._buildHeader(panelYear, panelMonth));

  if (this._viewMode === "day") {
    panel.appendChild(this._buildWeekdays());
    panel.appendChild(this._buildGrid(panelYear, panelMonth));
    if (this.opts.showTimePicker || this.opts.mode === "datetime-seconds") {
      panel.appendChild(this._buildTimePicker());
    }
  } else if (this._viewMode === "month") {
    panel.appendChild(this._buildMonthPanel());
  } else {
    panel.appendChild(this._buildYearPanel());
  }

  if (!footerOnTop && this._hasFooter()) {
    panel.appendChild(this._buildFooter());
  }
}

// ── Header ───────────────────────────────────────────────────────────────────

export function buildHeader(
  this: DatePicker,
  panelYear = this._viewYear,
  panelMonth = this._viewMonth,
): HTMLElement {
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

  const prevBtn = document.createElement("button");
  prevBtn.className = "dp-header-nav";
  prevBtn.setAttribute("aria-label", this._viewMode === "year" ? "Previous decade" : "Previous month");
  prevBtn.innerHTML = "‹";
  prevBtn.addEventListener("click", () => this._navigatePrev());
  header.appendChild(prevBtn);

  const title = document.createElement("div");
  title.className = "dp-header-title";

  if (this._viewMode === "day") {
    const monthNames = getMonthNames(this.opts.locale);
    const monthBtn = document.createElement("button");
    monthBtn.className = "dp-header-month";
    monthBtn.textContent = monthNames[panelMonth];
    monthBtn.setAttribute("aria-label", `Select month: ${monthNames[panelMonth]}`);
    monthBtn.setAttribute("aria-expanded", "false");
    monthBtn.addEventListener("click", () => { this._viewMode = "month"; this._refresh(); });

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

  const nextBtn = document.createElement("button");
  nextBtn.className = "dp-header-nav";
  nextBtn.setAttribute("aria-label", this._viewMode === "year" ? "Next decade" : "Next month");
  nextBtn.innerHTML = "›";
  nextBtn.addEventListener("click", () => this._navigateNext());
  header.appendChild(nextBtn);

  return header;
}

// ── Weekday Labels ───────────────────────────────────────────────────────────

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
    const dayIndex = (i + weekendOffset) % 7;
    const isWkend = dayIndex === 0 || dayIndex === 6;
    cell.className = `dp-weekday-label${isWkend ? " dp-weekday-label--weekend" : ""}`;
    cell.textContent = name.slice(0, 2);
    row.appendChild(cell);
  });

  return row;
}
