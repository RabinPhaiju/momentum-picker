// wheel/column-data.ts — Column item/def builders for MomentumPicker

import type { ColumnDef, ColumnItem } from "../types";
import type { ResolvedOptions } from "../types";
import {
  getDaysInMonth,
  generateRange,
  padZero,
  getMonthNames,
  clamp,
} from "../utils";

const DEFAULT_MIN_YEAR = 1924;
const DEFAULT_MAX_YEAR = 2124;

export function buildYearItems(opts: ResolvedOptions): ColumnItem[] {
  const minY = opts.minDate?.getFullYear() ?? DEFAULT_MIN_YEAR;
  const maxY = opts.maxDate?.getFullYear() ?? DEFAULT_MAX_YEAR;
  return generateRange(minY, maxY).map((y) => ({ label: String(y), value: y }));
}

export function buildMonthItems(opts: ResolvedOptions): ColumnItem[] {
  return getMonthNames(opts.locale).map((name, i) => ({ label: name, value: i }));
}

export function buildDayItems(year: number, month: number): ColumnItem[] {
  return generateRange(1, getDaysInMonth(year, month)).map((d) => ({
    label: padZero(d),
    value: d,
  }));
}

export function buildHourItems(): ColumnItem[] {
  return generateRange(0, 23).map((h) => ({ label: padZero(h), value: h }));
}

export function buildMinuteItems(opts: ResolvedOptions): ColumnItem[] {
  const step = opts.minuteStep;
  return generateRange(0, 59, step).map((m) => ({ label: padZero(m), value: m }));
}

export function buildColumnDefs(
  opts: ResolvedOptions,
  value: Date,
  onSelect: (key: ColumnDef["key"], idx: number) => void,
): ColumnDef[] {
  const defs: ColumnDef[] = [];
  const { mode, minuteStep } = opts;

  if (mode === "date" || mode === "datetime") {
    const yearItems = buildYearItems(opts);
    const yearIdx = yearItems.findIndex((i) => i.value === value.getFullYear());
    defs.push({
      key: "year", ariaLabel: "Year", items: yearItems,
      selectedIndex: clamp(yearIdx, 0, yearItems.length - 1),
      onSelect: (idx) => onSelect("year", idx),
    });

    const monthItems = buildMonthItems(opts);
    defs.push({
      key: "month", ariaLabel: "Month", items: monthItems,
      selectedIndex: value.getMonth(),
      onSelect: (idx) => onSelect("month", idx),
    });

    const dayItems = buildDayItems(value.getFullYear(), value.getMonth());
    defs.push({
      key: "day", ariaLabel: "Day", items: dayItems,
      selectedIndex: Math.min(value.getDate() - 1, dayItems.length - 1),
      onSelect: (idx) => onSelect("day", idx),
    });
  }

  if (mode === "time" || mode === "datetime") {
    defs.push({
      key: "hour", ariaLabel: "Hour", items: buildHourItems(),
      selectedIndex: value.getHours(),
      onSelect: (idx) => onSelect("hour", idx),
    });

    const minuteItems = buildMinuteItems(opts);
    const snappedMinute = Math.round(value.getMinutes() / minuteStep) * minuteStep;
    const minuteIdx = minuteItems.findIndex((i) => i.value === snappedMinute);
    defs.push({
      key: "minute", ariaLabel: "Minute", items: minuteItems,
      selectedIndex: clamp(minuteIdx, 0, minuteItems.length - 1),
      onSelect: (idx) => onSelect("minute", idx),
    });
  }

  return defs;
}
