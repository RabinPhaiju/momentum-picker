// ─────────────────────────────────────────────────────────────────────────────
// WheelColumn.ts — A single scrollable wheel column with:
//   • Infinite-scroll illusion (3× item duplication + seamless wrap)
//   • Momentum / inertia scrolling (velocity tracked on release)
//   • Snap-to-item (nearest item after deceleration)
//   • Touch AND mouse drag support
//   • Full keyboard navigation (ArrowUp / ArrowDown)
//   • ARIA listbox / option roles
// ─────────────────────────────────────────────────────────────────────────────

import type { ColumnDef, ColumnItem } from "./types";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Friction coefficient applied to velocity each frame (0 < f < 1). */
const FRICTION = 0.92;

/** Velocity (px/frame) below which momentum animation stops. */
const MIN_VELOCITY = 0.5;

/** Max sampling window (ms) for velocity calculation on release. */
const VELOCITY_SAMPLE_WINDOW = 80;

// ─────────────────────────────────────────────────────────────────────────────

interface PointerState {
  active: boolean;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number; // px per ms
  samples: Array<{ y: number; t: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────

export class WheelColumn {
  // ── DOM refs ────────────────────────────────────────────────────────────────
  readonly el: HTMLDivElement; // root column element
  private list: HTMLUListElement;
  private items: ColumnItem[];
  private itemHeight: number;

  // ── State ───────────────────────────────────────────────────────────────────
  private selectedIndex: number; // index into the ORIGINAL items array
  private currentOffset: number = 0; // current translateY in px
  private targetOffset: number = 0;
  private raf: number | null = null;
  private pointer: PointerState = {
    active: false,
    startY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    samples: [],
  };

  // ── Callback ────────────────────────────────────────────────────────────────
  private onSelect: (index: number) => void;

  // ── Infinite scroll helpers ─────────────────────────────────────────────────
  /**
   * We render 3 copies of the item list (top | middle | bottom) so the user
   * can scroll infinitely in either direction.  After snapping, we
   * silently teleport the scroll position back to the "middle" copy.
   */
  private get cloneCount(): number {
    return this.items.length;
  }

  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor(def: ColumnDef, itemHeight: number, visibleRows: number) {
    this.items = def.items;
    this.itemHeight = itemHeight;
    this.selectedIndex = def.selectedIndex;
    this.onSelect = def.onSelect;

    // Build DOM
    this.el = this.createColumnEl(def, visibleRows);
    this.list = this.el.querySelector<HTMLUListElement>(".mp-column-list")!;

    // Set initial scroll position — centre the selected item of the MIDDLE copy
    this.currentOffset = this.indexToOffset(this.selectedIndex);
    this.targetOffset = this.currentOffset;
    this.applyTransform(this.currentOffset, false);
    this.updateItemAriaSelected(this.selectedIndex);

    // Attach event listeners
    this.attachPointerListeners();
    this.attachKeyboardListeners();
  }

  // ── DOM Construction ────────────────────────────────────────────────────────

  private createColumnEl(def: ColumnDef, visibleRows: number): HTMLDivElement {
    const col = document.createElement("div");
    col.className = "mp-column";
    col.setAttribute("tabindex", "0");
    col.setAttribute("role", "listbox");
    col.setAttribute("aria-label", def.ariaLabel);
    col.setAttribute("aria-orientation", "vertical");

    // Hidden label for screen readers
    const label = document.createElement("span");
    label.className = "mp-column-label";
    label.textContent = def.ariaLabel;
    col.appendChild(label);

    // Build the list — 3 copies of the item array for infinite scroll
    const ul = document.createElement("ul");
    ul.className = "mp-column-list";
    ul.setAttribute("aria-label", def.ariaLabel);

    // We render: [copy 1 (top)] + [copy 2 (middle)] + [copy 3 (bottom)]
    for (let copy = 0; copy < 3; copy++) {
      def.items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "mp-column-item";
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(idx === def.selectedIndex));
        li.dataset.index = String(idx);
        li.dataset.copy = String(copy);
        li.textContent = item.label;
        ul.appendChild(li);
      });
    }

    col.appendChild(ul);

    // Padding top/bottom so selected item is centred in the visible window
    const halfPad = Math.floor(visibleRows / 2);
    ul.style.paddingTop = `${halfPad * this.itemHeight}px`;
    ul.style.paddingBottom = `${halfPad * this.itemHeight}px`;

    return col;
  }

  // ── Offset ↔ Index Mapping ──────────────────────────────────────────────────

  /**
   * Converts a logical item index (0 … items.length-1) in the MIDDLE copy
   * to a translateY offset (negative, scrolls list up to show that item).
   */
  private indexToOffset(index: number): number {
    // The middle copy starts at cloneCount * itemHeight
    const middleStart = this.cloneCount;
    return -((middleStart + index) * this.itemHeight);
  }

  /**
   * Converts the current translateY offset back to the nearest item index
   * (clamped to 0 … items.length-1), accounting for all 3 copies.
   */
  private offsetToIndex(offset: number): number {
    const total = this.items.length;
    // Which absolute row (across all 3 copies) are we centred on?
    const absoluteRow = Math.round(-offset / this.itemHeight);
    // Map back to the original item index (wrapping)
    return ((absoluteRow % total) + total) % total;
  }

  // ── Transform Application ───────────────────────────────────────────────────

  private applyTransform(offset: number, useTransition: boolean): void {
    if (useTransition) {
      this.list.style.transition = `transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    } else {
      this.list.style.transition = "none";
    }
    this.list.style.transform = `translateY(${offset}px)`;
  }

  /**
   * After snapping, silently teleport to the exact same item in the MIDDLE
   * copy so that the user can always scroll up or down without hitting a limit.
   */
  private normaliseOffset(): void {
    const total = this.items.length;
    // Which actual item are we on in absolute-row terms?
    const absRow = Math.round(-this.currentOffset / this.itemHeight);
    // Find the equivalent row in the MIDDLE copy
    const middleRow = this.cloneCount + (((absRow % total) + total) % total);
    const normalisedOffset = -(middleRow * this.itemHeight);

    if (normalisedOffset !== this.currentOffset) {
      // Teleport without animation
      this.currentOffset = normalisedOffset;
      this.targetOffset = normalisedOffset;
      this.applyTransform(this.currentOffset, false);
    }
  }

  // ── Snap Logic ──────────────────────────────────────────────────────────────

  private snap(): void {
    // Round to the nearest whole item
    const snappedRow = Math.round(-this.currentOffset / this.itemHeight);
    const snappedOffset = -(snappedRow * this.itemHeight);
    this.targetOffset = snappedOffset;

    this.applyTransform(this.targetOffset, true);

    // After the CSS transition finishes, update state + aria
    const transitionEnd = () => {
      this.list.removeEventListener("transitionend", transitionEnd);
      this.currentOffset = this.targetOffset;
      // Normalise so infinite scroll is always centred on the middle copy
      this.normaliseOffset();

      const newIndex = this.offsetToIndex(this.currentOffset);
      if (newIndex !== this.selectedIndex) {
        this.selectedIndex = newIndex;
        this.updateItemAriaSelected(newIndex);
        this.onSelect(newIndex);
      }
    };
    this.list.addEventListener("transitionend", transitionEnd);
  }

  // ── Momentum Animation ──────────────────────────────────────────────────────

  private startMomentum(velocityPxMs: number): void {
    // Convert velocity to px/frame (targeting 60fps)
    let vel = velocityPxMs * 16;

    const animate = () => {
      vel *= FRICTION;
      this.currentOffset += vel;
      this.applyTransform(this.currentOffset, false);

      if (Math.abs(vel) > MIN_VELOCITY) {
        this.raf = requestAnimationFrame(animate);
      } else {
        this.raf = null;
        this.snap();
      }
    };

    this.raf = requestAnimationFrame(animate);
  }

  // ── Pointer Event Handlers ─────────────────────────────────────────────────

  private attachPointerListeners(): void {
    const el = this.el;

    // ── Touch Events ──

    el.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        this.onDragStart(e.touches[0].clientY);
        e.preventDefault();
      },
      { passive: false },
    );

    el.addEventListener("touchmove", (e: TouchEvent) => {
      this.onDragMove(e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });

    el.addEventListener("touchend", (e: TouchEvent) => {
      this.onDragEnd(e.changedTouches[0].clientY);
    });

    // ── Mouse Events ──

    el.addEventListener("mousedown", (e: MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      this.onDragStart(e.clientY);
      e.preventDefault();
    });

    // mousemove / mouseup attach to window so drag continues even if the
    // pointer leaves the column element
    const onMouseMove = (e: MouseEvent) => {
      if (!this.pointer.active) return;
      this.onDragMove(e.clientY);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!this.pointer.active) return;
      this.onDragEnd(e.clientY);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Clean up on destroy (store refs for removal)
    (this as unknown as { _mouseMove: typeof onMouseMove })._mouseMove = onMouseMove;
    (this as unknown as { _mouseUp: typeof onMouseUp })._mouseUp = onMouseUp;
  }

  private onDragStart(clientY: number): void {
    // Cancel any ongoing momentum animation
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      // Sync currentOffset from the actual rendered transform
      this.syncOffsetFromDOM();
    }

    this.pointer = {
      active: true,
      startY: clientY,
      lastY: clientY,
      lastTime: performance.now(),
      velocity: 0,
      samples: [{ y: clientY, t: performance.now() }],
    };

    this.applyTransform(this.currentOffset, false);
  }

  private onDragMove(clientY: number): void {
    if (!this.pointer.active) return;

    const delta = clientY - this.pointer.lastY;
    this.currentOffset += delta;
    this.applyTransform(this.currentOffset, false);

    const now = performance.now();
    this.pointer.samples.push({ y: clientY, t: now });

    // Keep only recent samples within the velocity window
    const cutoff = now - VELOCITY_SAMPLE_WINDOW;
    this.pointer.samples = this.pointer.samples.filter((s) => s.t >= cutoff);

    this.pointer.lastY = clientY;
    this.pointer.lastTime = now;
  }

  private onDragEnd(_clientY: number): void {
    if (!this.pointer.active) return;
    this.pointer.active = false;

    // Calculate velocity from recent samples
    const samples = this.pointer.samples;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) {
        this.pointer.velocity = (last.y - first.y) / dt; // px/ms
      }
    }

    const absVelocity = Math.abs(this.pointer.velocity);
    if (absVelocity > 0.2) {
      // Apply momentum
      this.startMomentum(this.pointer.velocity);
    } else {
      // Snap directly
      this.snap();
    }
  }

  /**
   * Read the current translateY from the DOM. Used when interrupting a
   * CSS transition mid-flight.
   */
  private syncOffsetFromDOM(): void {
    const style = window.getComputedStyle(this.list);
    const matrix = new DOMMatrix(style.transform);
    this.currentOffset = matrix.m42; // translateY component
  }

  // ── Keyboard Navigation ────────────────────────────────────────────────────

  private attachKeyboardListeners(): void {
    this.el.addEventListener("keydown", (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this.scrollBy(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          this.scrollBy(-1);
          break;
        case "Home":
          e.preventDefault();
          this.scrollToIndex(0);
          break;
        case "End":
          e.preventDefault();
          this.scrollToIndex(this.items.length - 1);
          break;
      }
    });
  }

  // ── ARIA Helpers ───────────────────────────────────────────────────────────

  private updateItemAriaSelected(selectedIndex: number): void {
    const allItems = this.list.querySelectorAll<HTMLLIElement>(".mp-column-item");
    allItems.forEach((li) => {
      const idx = parseInt(li.dataset.index ?? "-1", 10);
      const isSelected = idx === selectedIndex;
      li.setAttribute("aria-selected", String(isSelected));
    });

    // Update the listbox's aria-activedescendant to the MIDDLE copy selected item
    // (for proper SR announcement without visual duplication)
    const middleItems = Array.from(allItems).filter(
      (li) => li.dataset.copy === "1" && parseInt(li.dataset.index ?? "-1", 10) === selectedIndex,
    );
    if (middleItems.length > 0) {
      const id = `mp-opt-${this.el.getAttribute("aria-label")?.replace(/\s+/g, "-")}-${selectedIndex}`;
      middleItems[0].id = id;
      this.el.setAttribute("aria-activedescendant", id);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Scroll to a specific item index with animation.
   */
  scrollToIndex(index: number, animated = true): void {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.selectedIndex = index;
    const offset = this.indexToOffset(index);
    this.currentOffset = offset;
    this.targetOffset = offset;
    this.applyTransform(offset, animated);
    this.updateItemAriaSelected(index);
  }

  /**
   * Scroll by a relative number of items (+1 = next, -1 = previous).
   */
  scrollBy(delta: number): void {
    const total = this.items.length;
    const newIndex = ((this.selectedIndex + delta) % total + total) % total;
    this.scrollToIndex(newIndex, true);
    this.onSelect(newIndex);
  }

  /**
   * Update the item list (e.g. when days-in-month changes).
   * Tries to preserve the currently selected value if it still exists.
   */
  updateItems(items: ColumnItem[], newSelectedIndex: number): void {
    this.items = items;
    const ul = this.list;

    // Rebuild list with 3 copies
    ul.innerHTML = "";
    for (let copy = 0; copy < 3; copy++) {
      items.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "mp-column-item";
        li.setAttribute("role", "option");
        li.setAttribute("aria-selected", String(idx === newSelectedIndex));
        li.dataset.index = String(idx);
        li.dataset.copy = String(copy);
        li.textContent = item.label;
        ul.appendChild(li);
      });
    }

    this.scrollToIndex(newSelectedIndex, false);
  }

  /** Currently selected item value. */
  getValue(): number {
    return this.items[this.selectedIndex]?.value ?? 0;
  }

  /** Currently selected index. */
  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  /** Clean up event listeners and DOM. */
  destroy(): void {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    const { _mouseMove, _mouseUp } = this as unknown as {
      _mouseMove: (e: MouseEvent) => void;
      _mouseUp: (e: MouseEvent) => void;
    };
    if (_mouseMove) window.removeEventListener("mousemove", _mouseMove);
    if (_mouseUp) window.removeEventListener("mouseup", _mouseUp);
    this.el.remove();
  }
}
