// wheel/render.ts — DOM rendering logic for MomentumPicker sheet/overlay

import type { ResolvedOptions, ColumnDef } from "../types";
import type { WheelColumn } from "../WheelColumn";

/** Build the overlay backdrop element (modal mode). */
export function buildOverlay(opts: ResolvedOptions, onCancel: () => void): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.className = "mp-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Date Time Picker");
  overlay.dataset.mpTheme = opts.theme;
  overlay.dataset.mpStyle = opts.style;
  overlay.addEventListener("click", (e) => {
    e.stopPropagation();
    if (e.target === overlay) onCancel();
  });
  return overlay;
}

/** Build the sheet element (inner container). */
export function buildSheet(opts: ResolvedOptions): HTMLDivElement {
  const sheet = document.createElement("div");
  sheet.className = "mp-sheet";
  if (opts.displayMode === "inline") sheet.classList.add("mp-inline");
  else if (opts.displayMode === "popover") sheet.classList.add("mp-popover");
  sheet.dataset.mpTheme = opts.theme;
  sheet.dataset.mpStyle = opts.style;
  sheet.style.setProperty("--mp-primary", opts.primaryColor);
  sheet.style.setProperty("--mp-item-height", `${opts.itemHeight}px`);
  sheet.style.setProperty("--mp-visible-rows", String(opts.visibleRows));
  sheet.style.setProperty("--mp-width", opts.width);
  sheet.addEventListener("click", (e) => e.stopPropagation());
  return sheet;
}

/** Build the header (Cancel / title / Done) for non-inline pickers. */
export function buildHeader(
  opts: ResolvedOptions,
  onCancel: () => void,
  onConfirm: () => void,
): HTMLDivElement {
  const header = document.createElement("div");
  header.className = "mp-header";

  const cancelBtn = document.createElement("div");
  cancelBtn.className = "mp-btn mp-btn-cancel";
  cancelBtn.setAttribute("role", "button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.setAttribute("aria-label", "Cancel date selection");
  cancelBtn.addEventListener("click", onCancel);

  const title = document.createElement("div");
  title.className = "mp-header-title";
  title.textContent = getTitleByMode(opts.mode);

  const confirmBtn = document.createElement("div");
  confirmBtn.className = "mp-btn mp-btn-confirm";
  confirmBtn.setAttribute("role", "button");
  confirmBtn.textContent = "Done";
  confirmBtn.setAttribute("aria-label", "Confirm date selection");
  confirmBtn.addEventListener("click", onConfirm);

  header.appendChild(cancelBtn);
  header.appendChild(title);
  header.appendChild(confirmBtn);
  return header;
}

function getTitleByMode(mode: string): string {
  switch (mode) {
    case "date": return "Select Date";
    case "time": return "Select Time";
    default: return "Select Date & Time";
  }
}

/** Build the columns container and instantiate WheelColumn instances. */
export function buildColumnsEl(
  defs: ColumnDef[],
  opts: ResolvedOptions,
  WheelColumnClass: new (...args: unknown[]) => WheelColumn,
  columns: Map<string, WheelColumn>,
): HTMLDivElement {
  const columnsEl = document.createElement("div");
  columnsEl.className = "mp-columns";
  columnsEl.style.setProperty("--mp-item-height", `${opts.itemHeight}px`);
  columnsEl.style.setProperty("--mp-visible-rows", String(opts.visibleRows));

  const selectionBand = document.createElement("div");
  selectionBand.className = "mp-selection-band";
  selectionBand.setAttribute("aria-hidden", "true");
  columnsEl.appendChild(selectionBand);

  defs.forEach((def, idx) => {
    const col = new WheelColumnClass(def, opts.itemHeight, opts.visibleRows, opts.is3D) as WheelColumn;
    columns.set(def.key, col);
    columnsEl.appendChild(col.el);

    // Add colon between hour and minute
    const nextDef = defs[idx + 1];
    if (def.key === "hour" && nextDef && nextDef.key === "minute") {
      const sep = document.createElement("div");
      sep.className = "mp-time-separator";
      sep.textContent = ":";
      columnsEl.appendChild(sep);
    }
  });

  return columnsEl;
}
