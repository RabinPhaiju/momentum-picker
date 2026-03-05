// calendar/handlers/show-hide.ts — Show, hide, focus and outside-click logic

import type { DatePicker } from "../DatePicker";
import type { PopoverPlacement } from "../positioning";
import { createAutoUpdater } from "../positioning";
import { formatValue } from "../utils";


export function show(this: DatePicker, animate = true): void {
  const { displayMode } = this.opts;

  if (displayMode === "modal" && this._overlayEl) {
    if (animate) {
      requestAnimationFrame(() => { this._overlayEl!.classList.add("dp-open"); });
    } else {
      this._overlayEl.classList.add("dp-open");
    }
  }

  if (displayMode === "popover" && this._panelEl && this._anchorEl) {
    this._panelEl.style.display = "block";
    this._stopAutoUpdate = createAutoUpdater(
      this._anchorEl,
      this._panelEl,
      ({ top, left }) => {
        this._panelEl!.style.top = `${top}px`;
        this._panelEl!.style.left = `${left}px`;
      },
      "bottom-start" as PopoverPlacement,
    );
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

  requestAnimationFrame(() => { this._attachTouchListeners(); });

  setTimeout(() => {
    const focused = this._getPanel()?.querySelector<HTMLElement>("[tabindex='0']");
    focused?.focus();
  }, 50);
}

export function hide(this: DatePicker, animate = true): void {
  const { displayMode } = this.opts;
  void animate;

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

export function handleOutsideClick(this: DatePicker, e: MouseEvent): void {
  if (!this._open) return;
  const target = e.target as Node;
  if (this._panelEl?.contains(target)) return;
  if (this._anchorEl?.contains(target)) return;
  setTimeout(() => { if (this._open) this._handleCancel(); }, 0);
}

export function handleCancel(this: DatePicker): void {
  this.opts.onCancel?.();
  this._hide();
}

export function handleConfirm(this: DatePicker): void {
  this._emitConfirm();
  this._hide();
}

export function emitChange(this: DatePicker): void {
  if (this.opts.onChange) {
    const formatted = this.opts.format
      ? formatValue(this._value, this.opts.format, this.opts.mode)
      : undefined;
    this.opts.onChange(this._value, formatted);
  }
}

export function emitConfirm(this: DatePicker): void {
  this.opts.onConfirm?.(this._value);
}

export function showValidationError(this: DatePicker, message: string): void {
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
