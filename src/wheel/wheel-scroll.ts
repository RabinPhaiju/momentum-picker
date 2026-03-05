// wheel/wheel-scroll.ts — Scroll physics, snap, momentum for WheelColumn

/** Friction coefficient applied to velocity each frame (0 < f < 1). */
export const FRICTION = 0.92;
/** Velocity (px/frame) below which momentum animation stops. */
export const MIN_VELOCITY = 0.5;
/** Max sampling window (ms) for velocity calculation on release. */
export const VELOCITY_SAMPLE_WINDOW = 80;

export interface WheelScrollState {
  currentOffset: number;
  targetOffset: number;
  raf: number | null;
  items: { value: number; label: string }[];
  itemHeight: number;
  list: HTMLUListElement;
  is3D: boolean;
  el: HTMLDivElement;
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function indexToOffset(
  index: number,
  cloneCount: number,
  itemHeight: number,
): number {
  return -((cloneCount + index) * itemHeight);
}

export function offsetToIndex(
  offset: number,
  total: number,
  itemHeight: number,
): number {
  const absoluteRow = Math.round(-offset / itemHeight);
  return ((absoluteRow % total) + total) % total;
}

export function normaliseOffset(
  state: Pick<WheelScrollState, "currentOffset" | "targetOffset" | "items" | "itemHeight" | "list" | "is3D">,
  applyTransform: (offset: number, useTransition: boolean) => void,
  cloneCount: number,
): number {
  const total = state.items.length;
  const absRow = Math.round(-state.currentOffset / state.itemHeight);
  const middleRow = cloneCount + (((absRow % total) + total) % total);
  const normalisedOffset = -(middleRow * state.itemHeight);
  if (normalisedOffset !== state.currentOffset) {
    applyTransform(normalisedOffset, false);
    return normalisedOffset;
  }
  return state.currentOffset;
}

export function checkWrap(currentOffset: number, total: number, itemHeight: number): number {
  const totalH = total * itemHeight;
  if (currentOffset < -totalH * 2) return currentOffset + totalH;
  if (currentOffset > -totalH) return currentOffset - totalH;
  return currentOffset;
}

export function startMomentum(
  initialVelocity: number,
  state: { currentOffset: number; raf: number | null },
  onUpdate: (offset: number) => void,
  onDone: () => void,
  items: unknown[],
  itemHeight: number,
): void {
  let vel = initialVelocity * 16;
  const animate = () => {
    vel *= FRICTION;
    state.currentOffset = checkWrap(state.currentOffset + vel, items.length, itemHeight);
    onUpdate(state.currentOffset);
    if (Math.abs(vel) > MIN_VELOCITY) {
      state.raf = requestAnimationFrame(animate);
    } else {
      state.raf = null;
      onDone();
    }
  };
  state.raf = requestAnimationFrame(animate);
}
