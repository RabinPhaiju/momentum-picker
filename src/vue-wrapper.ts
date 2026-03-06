import { defineComponent, h, ref, onMounted, onBeforeUnmount, watch, computed, PropType, StyleValue } from 'vue';
import { MomentumPicker, PickerOptions } from './index';
import { DatePicker, DatePickerOptions, PickerValue } from './index';
import { formatDate } from './utils';

// Import styles to ensure they are available
import './styles/wheel.css';
import './styles/calendar.css';

// ─────────────────────────────────────────────────────────────────────────────
// Vue Wrapper for MomentumPicker
// ─────────────────────────────────────────────────────────────────────────────
export interface VueMomentumPickerProps extends Omit<PickerOptions, 'container' | 'open' | 'onChange' | 'onConfirm' | 'onCancel'> {
  open?: boolean;
  value?: Date;
  inputStyle?: StyleValue;
  inputClass?: string;
  use24h?: boolean;
}

export const VueMomentumPicker = defineComponent({
  name: 'VueMomentumPicker',
  props: {
    open: { type: Boolean, default: undefined },
    value: { type: Date as PropType<Date>, default: undefined },
    mode: { type: String as PropType<PickerOptions['mode']>, default: 'datetime' },
    displayMode: { type: String as PropType<PickerOptions['displayMode']>, default: 'inline' },
    theme: { type: String as PropType<PickerOptions['theme']>, default: 'light' },
    style: { type: String, default: 'default' },
    primaryColor: { type: String, default: '#007aff' },
    minDate: { type: Date as PropType<Date>, default: undefined },
    maxDate: { type: Date as PropType<Date>, default: undefined },
    minuteStep: { type: Number, default: 1 },
    format: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    itemHeight: { type: Number, default: 44 },
    visibleRows: { type: Number, default: 5 },
    is3D: { type: Boolean, default: true },
    anchor: { type: [String, Object] as PropType<string | HTMLElement>, default: undefined },
    inputStyle: { type: Object as PropType<StyleValue>, default: () => ({}) },
    inputClass: { type: String, default: '' },
    use24h: { type: Boolean, default: undefined }, // Just in case users pass it incorrectly from docs, absorb it
  },
  emits: ['update:value', 'change', 'confirm', 'cancel'],
  setup(props, { emit, slots, attrs }) {
    const containerRef = ref<HTMLElement | null>(null);
    let picker: MomentumPicker | null = null;

    const initPicker = () => {
      if (!containerRef.value) return;
      if (picker) {
        picker.destroy();
        picker = null;
      }
      const isInline = props.displayMode === 'inline' || !props.displayMode;
      const anchorNode = props.anchor || (props.displayMode === 'popover' ? containerRef.value : undefined);
      const containerNode = isInline ? containerRef.value : document.body;

      picker = new MomentumPicker({
        ...props,
        ...(attrs as Record<string, any>),
        mode: props.mode as any,
        container: containerNode,
        anchor: anchorNode,
        style: props.style as any,
        displayMode: props.displayMode,
        onChange: (date, formatted) => {
          emit('update:value', date);
          emit('change', date, formatted);
        },
        onConfirm: (date, formatted) => {
          emit('update:value', date);
          emit('confirm', date, formatted);
        },
        onCancel: () => {
          emit('cancel');
        }
      });
      if (props.open) picker.show();
    };

    onMounted(() => {
      setTimeout(initPicker, 0);
    });

    onBeforeUnmount(() => {
      if (picker) {
        picker.destroy();
        picker = null;
      }
    });

    watch(() => [props.displayMode, props.mode], () => {
      initPicker();
    });

    watch(() => props.open, (newVal) => {
      if (!picker) return;
      if (newVal) picker.show();
      else picker.hide();
    });

    watch(() => props, () => {
      if (!picker) return;
      picker.setOptions({ ...props, ...(attrs as Record<string, any>), style: props.style as any });
      if (props.value) {
        picker.setValue(props.value);
      }
    }, { deep: true });

    const isInline = computed(() => props.displayMode === 'inline' || !props.displayMode);

    const displayValue = computed(() => {
      if (!(props.value instanceof Date)) return '';
      const fmt = props.format || (props.mode === 'datetime' ? 'YYYY-MM-DD HH:mm' : props.mode === 'time' ? 'HH:mm' : 'YYYY-MM-DD');
      return formatDate(props.value, fmt, props.locale);
    });

    return () => {
      const childElements = slots.default ? slots.default() : null;
      
      return h('div', {
        ref: containerRef,
        class: 'momentum-picker-vue-wrapper',
        style: { display: isInline.value ? 'block' : 'inline-block', width: isInline.value ? '100%' : 'auto' },
        onClick: (e: MouseEvent) => {
           e.stopPropagation();
           if (!isInline.value && picker) picker.toggle();
        }
      }, [
        childElements ? childElements : (!isInline.value ? h('input', {
          readonly: true,
          class: `mp-vue-input ${props.inputClass}`,
          value: displayValue.value,
          placeholder: 'Select...',
          style: {
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid rgba(60, 60, 67, 0.12)',
            background: '#f2f2f7',
            color: '#1c1c1e',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            fontSize: '14px',
            outline: 'none',
            ...(props.inputStyle as any)
          }
        }) : null)
      ]);
    };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Vue Wrapper for DatePicker
// ─────────────────────────────────────────────────────────────────────────────
export interface VueDatePickerProps extends Omit<DatePickerOptions, 'container' | 'open' | 'onChange' | 'onConfirm' | 'onCancel'> {
  open?: boolean;
  value?: PickerValue;
  inputStyle?: StyleValue;
  inputClass?: string;
}

export const VueDatePicker = defineComponent({
  name: 'VueDatePicker',
  props: {
    open: { type: Boolean, default: undefined },
    value: { type: [Date, Array] as PropType<PickerValue>, default: undefined },
    mode: { type: String as PropType<DatePickerOptions['mode']>, default: 'single' },
    displayMode: { type: String as PropType<DatePickerOptions['displayMode']>, default: 'inline' },
    theme: { type: String as PropType<DatePickerOptions['theme']>, default: 'light' },
    primaryColor: { type: String, default: '#007aff' },
    numberOfMonths: { type: Number, default: 1 },
    minDate: { type: Date as PropType<Date>, default: undefined },
    maxDate: { type: Date as PropType<Date>, default: undefined },
    format: { type: String, default: undefined },
    locale: { type: String, default: undefined },
    anchor: { type: [String, Object] as PropType<string | HTMLElement>, default: undefined },
    inputStyle: { type: Object as PropType<StyleValue>, default: () => ({}) },
    inputClass: { type: String, default: '' },
    showToday: { type: Boolean, default: false },
    showClear: { type: Boolean, default: false },
    showTimePicker: { type: Boolean, default: false },
    showSeconds: { type: Boolean, default: false },
    allowPaste: { type: Boolean, default: false },
    weekStartsOn: { type: Number, default: 0 },
    showWeekNumbers: { type: Boolean, default: false },
  },
  emits: ['update:value', 'change', 'confirm', 'cancel'],
  setup(props, { emit, slots, attrs }) {
    const containerRef = ref<HTMLElement | null>(null);
    let picker: DatePicker | null = null;

    const initPicker = () => {
      if (!containerRef.value) return;
      if (picker) {
        picker.destroy();
        picker = null;
      }
      
      const isInline = props.displayMode === 'inline' || !props.displayMode;
      const anchorNode = props.anchor || (props.displayMode === 'popover' ? containerRef.value : undefined);
      const containerNode = isInline ? containerRef.value : document.body;

      picker = new DatePicker({
        ...props,
        ...(attrs as Record<string, any>),
        container: containerNode,
        anchor: anchorNode,
        mode: props.mode as any,
        displayMode: props.displayMode,
      } as any);
      
      // Monkey patch event handlers since we casted to any
      picker.opts.onChange = (val: any, formatted: any) => {
        emit('update:value', val);
        emit('change', val, formatted);
      };
      picker.opts.onConfirm = (val: any) => {
        emit('update:value', val);
        emit('confirm', val);
      };
      picker.opts.onCancel = () => {
        emit('cancel');
      };
      
      if (props.open) picker.show();
    };

    onMounted(() => {
      setTimeout(initPicker, 0);
    });

    onBeforeUnmount(() => {
      if (picker) {
        picker.destroy();
        picker = null;
      }
    });

    watch(() => [props.displayMode, props.mode, props.numberOfMonths], () => {
      initPicker();
    });

    watch(() => props.open, (newVal) => {
      if (!picker) return;
      if (newVal) picker.show();
      else picker.hide();
    });

    watch(() => props, () => {
      if (!picker) return;
      picker.setOptions({ ...props, ...(attrs as Record<string, any>) } as any);
    }, { deep: true });

    const isInline = computed(() => props.displayMode === 'inline' || !props.displayMode);

    const displayValue = computed(() => {
      const val = props.value;
      if (!val) return '';
      const fmt = props.format || 'YYYY-MM-DD';

      if (val instanceof Date) return formatDate(val, fmt);
      if (Array.isArray(val)) {
        if (val[0] instanceof Date && val[1] instanceof Date) {
          return `${formatDate(val[0], fmt)} - ${formatDate(val[1], fmt)}`;
        }
        if (val[0] instanceof Date) {
          return val.map((d: any) => (d instanceof Date ? formatDate(d, fmt) : '')).join(', ');
        }
      }
      return '';
    });

    return () => {
      const childElements = slots.default ? slots.default() : null;
      
      return h('div', {
        ref: containerRef,
        class: 'date-picker-vue-wrapper',
        style: { display: isInline.value ? 'block' : 'inline-block', width: isInline.value ? '100%' : 'auto' },
        onClick: (e: MouseEvent) => {
          e.stopPropagation();
          if (!isInline.value && picker) picker.toggle();
        }
      }, [
        childElements ? childElements : (!isInline.value ? h('input', {
          readonly: true,
          class: `dp-vue-input ${props.inputClass}`,
          value: displayValue.value,
          placeholder: 'Select date...',
          style: {
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1.5px solid rgba(60, 60, 67, 0.12)',
            background: '#f2f2f7',
            color: '#1c1c1e',
            cursor: 'pointer',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            fontSize: '14px',
            outline: 'none',
            ...(props.inputStyle as any)
          }
        }) : null)
      ]);
    };
  }
});
