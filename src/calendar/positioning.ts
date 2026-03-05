// ─────────────────────────────────────────────────────────────────────────────
// calendar/positioning.ts — Smart popover positioning logic.
//
// Computes the best position (bottom, top, right, left) for a floating element
// relative to an anchor, automatically flipping when near viewport edges.
// ─────────────────────────────────────────────────────────────────────────────

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "bottom"
  | "top-start"
  | "top-end"
  | "top"
  | "right"
  | "left";

export interface PositionResult {
  top: number;
  left: number;
  placement: PopoverPlacement;
}

const MARGIN = 8; // px gap between anchor and popover

/**
 * Computes the pixel position for a floating element anchored to `anchor`.
 *
 * Strategy:
 *  1. Try preferred placement (bottom-start by default).
 *  2. If it overflows the viewport, try the opposite side.
 *  3. Apply edge clamping so the popover never bleeds off screen.
 */
export function computePosition(
  anchor: HTMLElement,
  floating: HTMLElement,
  preferred: PopoverPlacement = "bottom-start",
): PositionResult {
  const aRect = anchor.getBoundingClientRect();
  const fWidth = floating.offsetWidth;
  const fHeight = floating.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // ── Candidate positions ────────────────────────────────────────────────────

  function tryPlacement(pl: PopoverPlacement): { top: number; left: number; fits: boolean } {
    let top = 0;
    let left = 0;

    // Vertical
    if (pl.startsWith("bottom")) {
      top = aRect.bottom + scrollY + MARGIN;
    } else if (pl.startsWith("top")) {
      top = aRect.top + scrollY - fHeight - MARGIN;
    } else if (pl === "right") {
      top = aRect.top + scrollY + aRect.height / 2 - fHeight / 2;
      left = aRect.right + scrollX + MARGIN;
    } else if (pl === "left") {
      top = aRect.top + scrollY + aRect.height / 2 - fHeight / 2;
      left = aRect.left + scrollX - fWidth - MARGIN;
    }

    // Horizontal alignment (for top / bottom variants)
    if (pl.startsWith("bottom") || pl.startsWith("top")) {
      if (pl.endsWith("start") || pl === "bottom" || pl === "top") {
        left = aRect.left + scrollX;
      } else if (pl.endsWith("end")) {
        left = aRect.right + scrollX - fWidth;
      }
    }

    // Clamp to viewport with margin
    const clampedLeft = Math.max(
      MARGIN + scrollX,
      Math.min(left, vw + scrollX - fWidth - MARGIN),
    );
    const clampedTop = Math.max(
      MARGIN + scrollY,
      Math.min(top, vh + scrollY - fHeight - MARGIN),
    );

    // Check if the intended (pre-clamped) position fits in viewport
    const clientTop = top - scrollY;
    const clientBottom = clientTop + fHeight;
    const clientLeft = left - scrollX;
    const clientRight = clientLeft + fWidth;

    const fits =
      clientTop >= 0 &&
      clientBottom <= vh &&
      clientLeft >= 0 &&
      clientRight <= vw;

    return { top: clampedTop, left: clampedLeft, fits };
  }

  // ── Try preferred, then opposites ─────────────────────────────────────────

  const fallbacks: PopoverPlacement[] = [
    preferred,
    preferred.startsWith("bottom") ? ("top-start" as PopoverPlacement) : ("bottom-start" as PopoverPlacement),
    "bottom-start",
    "top-start",
    "bottom-end",
    "top-end",
  ];

  for (const pl of fallbacks) {
    const { top, left, fits } = tryPlacement(pl);
    if (fits) {
      return { top, left, placement: pl };
    }
  }

  // Last resort: use clamped bottom-start
  const { top, left } = tryPlacement("bottom-start");
  return { top, left, placement: "bottom-start" };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Keeps the floating element positioned relative to its anchor.
 * Returns a cleanup function that stops repositioning.
 */
export function createAutoUpdater(
  anchor: HTMLElement,
  floating: HTMLElement,
  onPosition: (result: PositionResult) => void,
  preferred: PopoverPlacement = "bottom-start",
): () => void {
  let raf: number | null = null;
  let lastTop = -1;
  let lastLeft = -1;

  const update = () => {
    const result = computePosition(anchor, floating, preferred);
    if (result.top !== lastTop || result.left !== lastLeft) {
      lastTop = result.top;
      lastLeft = result.left;
      onPosition(result);
    }
  };

  const scheduleUpdate = () => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      update();
      raf = null;
    });
  };

  // Initial position
  update();

  // Re-position on scroll and resize
  window.addEventListener("scroll", scheduleUpdate, { passive: true, capture: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });

  return () => {
    if (raf !== null) cancelAnimationFrame(raf);
    window.removeEventListener("scroll", scheduleUpdate, { capture: true });
    window.removeEventListener("resize", scheduleUpdate);
  };
}
