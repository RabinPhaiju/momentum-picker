<!--
  vue-wrapper.vue

  A Vue 3 wrapper component for momentum-picker.
  Uses onMounted / onUnmounted to manage the picker lifecycle.

  Usage:
    <MomentumPickerVue
      :is-open="showPicker"
      display-mode="modal"
      mode="datetime"
      :value="selectedDate"
      theme="dark"
      style="material"
      @confirm="onConfirm"
      @cancel="onCancel"
      @change="onChange"
    />
-->

<template>
  <!-- Hidden mount point for the vanilla picker overlay -->
  <div ref="containerRef" aria-hidden="true" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import MomentumPicker from "../src/index"; // use 'momentum-picker' after npm install
import type { PickerOptions, PickerMode, PickerTheme } from "../src/types";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  isOpen?: boolean;
  mode?: PickerMode;
  displayMode?: "modal" | "popover" | "inline";
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  minuteStep?: number;
  format?: string;
  locale?: string;
  theme?: PickerTheme;
  style?: string;
  primaryColor?: string;
  itemHeight?: number;
  visibleRows?: number;
  is3D?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
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
});

// ── Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  /** Fired every time a wheel column changes. */
  change: [date: Date, formatted?: string];
  /** Fired when user taps Done. */
  confirm: [date: Date, formatted?: string];
  /** Fired when user taps Cancel or presses Escape. */
  cancel: [];
}>();

// ── Internal refs ──────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null);
let picker: MomentumPicker | null = null;

// ── Lifecycle ──────────────────────────────────────────────────────────────

onMounted(() => {
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
    style: props.style,
    primaryColor: props.primaryColor,
    itemHeight: props.itemHeight,
    visibleRows: props.visibleRows,
    is3D: props.is3D,
    onChange: (date, formatted) => emit("change", date, formatted),
    onConfirm: (date, formatted) => emit("confirm", date, formatted),
    onCancel: () => emit("cancel"),
  };

  picker = new MomentumPicker(options);

  // Respect initial isOpen state
  if (props.isOpen) picker.show();
});

onUnmounted(() => {
  picker?.destroy();
  picker = null;
});

// ── Watchers ───────────────────────────────────────────────────────────────

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!picker) return;
    if (isOpen) {
      picker.show();
    } else {
      picker.hide();
    }
  },
);

watch(
  () => props.value,
  (newVal) => {
    if (picker && newVal) picker.setValue(newVal);
  },
);

watch(
  () => [props.theme, props.style, props.primaryColor, props.is3D] as const,
  ([theme, style, primaryColor, is3D]) => {
    picker?.setOptions({ theme, style, primaryColor, is3D });
  },
);

watch(
  () => props.displayMode,
  () => {
    // Note: displayMode cannot be changed after init, would need to recreate
    console.warn("displayMode cannot be changed after initialization");
  },
);
</script>

<!--
  Example parent component usage:
  ────────────────────────────────

  See vue example in index.html for a complete working example.
  
  Basic usage:
  <template>
    <MomentumPickerVue
      :is-open="showPicker"
      display-mode="modal"
      mode="datetime"
      :value="selectedDate"
      :theme="theme"
      :style="pickerStyle"
      :is3D="is3D"
      @confirm="onConfirm"
      @cancel="showPicker = false"
    />
  </template>
  
  Features:
  - Control visibility with :is-open
  - Switch display modes: 'modal', 'popover', 'inline'
  - Change themes: 'light', 'dark'
  - Apply 16+ visual styles
  - Toggle 3D effect
  - Customize time step with :minute-step
  - Set min/max dates
  - Custom primary color
-->

<style scoped>
/* No styles needed - picker is vanilla */
</style>
