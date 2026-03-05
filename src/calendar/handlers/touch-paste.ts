// calendar/handlers/touch-paste.ts — Touch swipe gestures & clipboard paste

import type { DatePicker } from "../DatePicker";

// ── Touch Swipe ──────────────────────────────────────────────────────────────

export function handleTouchStart(this: DatePicker, e: TouchEvent): void {
  const touch = e.touches[0];
  if (!touch) return;
  this._touchStartX = touch.clientX;
  this._touchStartY = touch.clientY;
}

export function handleTouchEnd(this: DatePicker, e: TouchEvent): void {
  const touch = e.changedTouches[0];
  if (!touch) return;

  // reset drag flag (if we started one via touchstart above)
  if (this._isDragging) {
    this._isDragging = false;
  }

  const deltaX = touch.clientX - this._touchStartX;
  const deltaY = touch.clientY - this._touchStartY;
  if (Math.abs(deltaX) < 50) return;
  if (Math.abs(deltaY) > Math.abs(deltaX)) return;
  if (deltaX < 0) this._navigateNext();
  else this._navigatePrev();
}

// ── Clipboard Paste ───────────────────────────────────────────────────────────

const DATE_PATTERNS = [
  /(\d{4})-(\d{1,2})-(\d{1,2})/,
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
  /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
  /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
];

function tryParseDate(text: string): Date | null {
  const cleaned = text.trim();
  const direct = Date.parse(cleaned);
  if (!isNaN(direct)) {
    const d = new Date(direct);
    if (d.getFullYear() >= 1900 && d.getFullYear() <= 2200) return d;
  }
  for (const pattern of DATE_PATTERNS) {
    const m = cleaned.match(pattern);
    if (m) {
      const attempt = new Date(m[0]);
      if (!isNaN(attempt.getTime())) return attempt;
    }
  }
  return null;
}

export function handleTouchMove(this: DatePicker, e: TouchEvent): void {
  // Previously used for range-drag. Removed to ensure reliable swipe navigation.
  if (this.opts.mode !== "range" || !this._isDragging) return;
  e.preventDefault();
}

export function handlePaste(this: DatePicker, e: ClipboardEvent): void {
  if (!this._open && this.opts.displayMode !== "inline") return;
  const text = e.clipboardData?.getData("text") ?? "";
  if (!text.trim()) return;
  const parsed = tryParseDate(text);
  if (!parsed) return;
  this._viewYear = parsed.getFullYear();
  this._viewMonth = parsed.getMonth();
  this._viewMode = "day";
  this._selectDate(parsed);
  showPasteToast(this, parsed);
}

function showPasteToast(picker: DatePicker, date: Date): void {
  const panel = picker._getPanel();
  if (!panel) return;
  panel.querySelector(".dp-paste-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "dp-paste-toast";
  toast.textContent = `📋 ${date.toLocaleDateString(picker.opts.locale)}`;
  panel.appendChild(toast);
  requestAnimationFrame(() => { toast.classList.add("dp-paste-toast--visible"); });
  setTimeout(() => {
    toast.classList.remove("dp-paste-toast--visible");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
