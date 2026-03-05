// wheel/wheel-drag.ts — Pointer (touch + mouse) drag handlers for WheelColumn

export const VELOCITY_SAMPLE_WINDOW = 80;

export interface PointerState {
  active: boolean;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  samples: Array<{ y: number; t: number }>;
}

export interface DragCallbacks {
  onDragStart: (y: number) => void;
  onDragMove: (y: number) => void;
  onDragEnd: (y: number) => void;
}

export function attachPointerListeners(
  el: HTMLDivElement,
  callbacks: DragCallbacks,
  onMouseMove: (e: MouseEvent) => void,
  onMouseUp: (e: MouseEvent) => void,
): void {
  el.addEventListener("touchstart", (e: TouchEvent) => {
    callbacks.onDragStart(e.touches[0].clientY);
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  el.addEventListener("touchmove", (e: TouchEvent) => {
    callbacks.onDragMove(e.touches[0].clientY);
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false });

  el.addEventListener("touchend", (e: TouchEvent) => {
    callbacks.onDragEnd(e.changedTouches[0].clientY);
    e.stopPropagation();
  });

  el.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.button !== 0) return;
    callbacks.onDragStart(e.clientY);
    e.preventDefault();
  });

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
}

export function calcVelocity(
  samples: Array<{ y: number; t: number }>,
): number {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return (last.y - first.y) / dt;
}

export function filterSamples(
  samples: Array<{ y: number; t: number }>,
  now: number,
): Array<{ y: number; t: number }> {
  const cutoff = now - VELOCITY_SAMPLE_WINDOW;
  return samples.filter((s) => s.t >= cutoff);
}
