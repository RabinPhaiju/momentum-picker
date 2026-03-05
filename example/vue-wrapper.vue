<template>
  <div v-if="pickerType === 'wheel'" ref="containerRef" aria-hidden="true" />
  <div v-else ref="calendarRef" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import MomentumPicker from "../src/index";
import { DatePicker } from "../src/calendar/DatePicker";
import type { PickerOptions, PickerMode, PickerTheme, PickerStyle } from "../src/types";
import type { DatePickerOptions, PickerValue, SelectionMode, DPTheme, DisplayMode } from "../src/calendar/types";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  pickerType?: "wheel" | "calendar";
  isOpen?: boolean;
  
  // Wheel Props
  mode?: PickerMode;
  displayMode?: "modal" | "popover" | "inline";
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  minuteStep?: number;
  format?: string | null;
  locale?: string;
  theme?: PickerTheme;
  style?: string;
  primaryColor?: string;
  itemHeight?: number;
  visibleRows?: number;
  is3D?: boolean;

  // Calendar Props
  calendarMode?: SelectionMode;
  calendarValue?: PickerValue;
  showTimePicker?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  pickerType: "wheel",
  isOpen: false,
  mode: "datetime",
  displayMode: "modal",
  visibleRows: 5,
  itemHeight: 44,
  theme: "light",
  style: "default",
  primaryColor: "#007aff",
  minuteStep: 1,
  is3D: true,
  calendarMode: "single",
  showTimePicker: false,
});

// ── Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  (e: "change", date: any, formatted?: string): void;
  (e: "confirm", date: any, formatted?: string): void;
  (e: "cancel"): void;
}>();

// ── Internal refs ──────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null);
const calendarRef = ref<HTMLDivElement | null>(null);
let wheelPicker: MomentumPicker | null = null;
let calendarPicker: DatePicker | null = null;

// ── Lifecycle ──────────────────────────────────────────────────────────────

const initWheel = () => {
  if (!containerRef.value) return;
  const options: PickerOptions = {
    container: containerRef.value,
    mode: props.mode,
    displayMode: props.displayMode as any,
    value: props.value ?? new Date(),
    minDate: props.minDate,
    maxDate: props.maxDate,
    minuteStep: props.minuteStep,
    format: props.format,
    locale: props.locale,
    theme: props.theme,
    style: props.style as PickerStyle,
    primaryColor: props.primaryColor,
    itemHeight: props.itemHeight,
    visibleRows: props.visibleRows,
    is3D: props.is3D,
    onChange: (date, formatted) => emit("change", date, formatted),
    onConfirm: (date, formatted) => emit("confirm", date, formatted),
    onCancel: () => emit("cancel"),
  };
  wheelPicker = new MomentumPicker(options);
  if (props.isOpen) wheelPicker.show();
};

const initCalendar = () => {
  if (!calendarRef.value) return;
  const options: DatePickerOptions = {
    container: calendarRef.value,
    mode: props.calendarMode,
    displayMode: props.displayMode as DisplayMode,
    value: props.calendarValue ?? new Date(),
    theme: props.theme as DPTheme,
    primaryColor: props.primaryColor,
    showTimePicker: props.showTimePicker,
    onChange: (val) => emit("change", val),
    onConfirm: (val) => emit("confirm", val),
    onCancel: () => emit("cancel"),
  };
  calendarPicker = new DatePicker(options);
  if (props.isOpen) calendarPicker.show();
};

onMounted(() => {
  if (props.pickerType === "wheel") initWheel();
  else initCalendar();
});

onUnmounted(() => {
  wheelPicker?.destroy();
  calendarPicker?.destroy();
});

// ── Watchers ───────────────────────────────────────────────────────────────

watch(() => props.pickerType, (type) => {
  wheelPicker?.destroy();
  calendarPicker?.destroy();
  wheelPicker = null;
  calendarPicker = null;
  setTimeout(() => {
    if (type === "wheel") initWheel();
    else initCalendar();
  }, 0);
});

watch(() => props.isOpen, (isOpen) => {
  if (wheelPicker) isOpen ? wheelPicker.show() : wheelPicker.hide();
  if (calendarPicker) isOpen ? calendarPicker.show() : calendarPicker.hide();
});

watch(() => props.value, (val) => {
  if (wheelPicker && val) wheelPicker.setValue(val);
});

watch(() => props.calendarValue, (val) => {
  if (calendarPicker && val) calendarPicker.setValue(val);
});

watch(() => [props.theme, props.style, props.primaryColor, props.is3D] as const, ([theme, style, primaryColor, is3D]) => {
  wheelPicker?.setOptions({ theme: theme as PickerTheme, style: style as PickerStyle, primaryColor, is3D });
  calendarPicker?.setOptions({ theme: theme as DPTheme, primaryColor });
});
</script>

<!--
  Example parent component usage:
  ────────────────────────────────
  
  <template>
    <div>
      <div class="tabs">
        <button @click="type = 'wheel'" :class="{active: type === 'wheel'}">Wheel</button>
        <button @click="type = 'calendar'" :class="{active: type === 'calendar'}">Calendar</button>
      </div>

      <MomentumPickerVue
        :picker-type="type"
        :is-open="show"
        :display-mode="mode"
        :theme="theme"
        @confirm="onConfirm"
        @cancel="show = false"
      />
    </div>
  </template>
-->

<style scoped>
/* No styles needed - picker is vanilla */
</style>
