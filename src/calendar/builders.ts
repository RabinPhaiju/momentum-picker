// calendar/builders.ts — Barrel re-export (delegates to builders/ sub-modules)
// This file keeps backward compatibility for any existing imports.

export {
  buildPanel,
  renderPanelContent,
  buildHeader,
  buildWeekdays,
  buildGrid,
  buildDayCell,
  buildDefaultDayCell,
  buildMonthPanel,
  buildYearPanel,
  hasFooter,
  buildFooter,
  buildTimePicker,
} from "./builders/index";
