<!--
  vue-wrapper.vue

  A Vue 3 wrapper component for momentum-picker.
  Uses onMounted / onUnmounted to manage the picker lifecycle.

  Usage:
    <MomentumPickerVue
      :is-open="showPicker"
      mode="datetime"
      :value="selectedDate"
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
  value?: Date;
  minDate?: Date;
  maxDate?: Date;
  minuteStep?: number;
  format?: string;
  locale?: string;
  theme?: PickerTheme;
  primaryColor?: string;
  itemHeight?: number;
  visibleRows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  mode: "datetime",
  visibleRows: 5,
  itemHeight: 44,
  theme: "light",
  primaryColor: "#007aff",
  minuteStep: 1,
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
    value: props.value ?? new Date(),
    minDate: props.minDate,
    maxDate: props.maxDate,
    minuteStep: props.minuteStep,
    format: props.format,
    locale: props.locale,
    theme: props.theme,
    primaryColor: props.primaryColor,
    itemHeight: props.itemHeight,
    visibleRows: props.visibleRows,
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
  () => [props.theme, props.primaryColor] as const,
  ([theme, primaryColor]) => {
    picker?.setOptions({ theme, primaryColor });
  },
);
</script>

<!--
  Example parent usage:
  ─────────────────────────────────────────────────────────

  <template>
    <div>
      <p>Selected: {{ selectedDate.toLocaleString() }}</p>
      <button @click="showPicker = true">Open Picker</button>

      <MomentumPickerVue
        :is-open="showPicker"
        mode="datetime"
        :value="selectedDate"
        format="YYYY-MM-DD HH:mm"
        @confirm="onConfirm"
        @cancel="showPicker = false"
      />
    </div>
  </template>

  <script setup lang="ts">
  import { ref } from 'vue';
  import MomentumPickerVue from './vue-wrapper.vue';

  const showPicker = ref(false);
  const selectedDate = ref(new Date());

  const onConfirm = (date: Date, formatted?: string) => {
    selectedDate.value = date;
    showPicker.value = false;
    console.log('Confirmed:', formatted ?? date);
  };
  <\/script>
-->
