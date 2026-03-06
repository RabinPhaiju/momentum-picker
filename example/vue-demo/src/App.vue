<script setup lang="ts">
import { ref, computed } from 'vue'
import { VueMomentumPicker, VueDatePicker } from '../../../src/vue-wrapper'
import type { PickerValue } from '../../../src/calendar/types'

// Import the CSS for the pickers
import '../../../src/styles/wheel.css'
import '../../../src/styles/calendar.css'

import './style.css'

const dateValue = ref<PickerValue>([new Date(), new Date(Date.now() + 86400000)]) // Start and end date for range mode
const wheelValue = ref<Date>(new Date())

const handleDateChange = (val: PickerValue, formatted?: string) => {
  console.log('DatePicker Change:', val, formatted)
  dateValue.value = val
}

const handleWheelChange = (date: Date, formatted?: string) => {
  console.log('Wheel Change:', date, formatted)
  wheelValue.value = date
}

const displayDateValue = computed(() => {
  const val = dateValue.value
  if (!val) return 'None'
  if (Array.isArray(val)) {
    return (val as any[]).filter(d => d instanceof Date).map(d => d.toDateString()).join(', ')
  }
  return val instanceof Date ? val.toDateString() : 'None'
})
</script>

<template>
  <div class="demo-container">
    <header class="demo-header">
      <h1>Momentum Picker Vue Demo</h1>
      <p>Testing the Vue wrappers for DatePicker and MomentumPicker</p>
    </header>

    <main class="demo-grid">
      <section class="demo-card">
        <h2>Calendar DatePicker</h2>
        <div class="picker-wrapper">
          <VueDatePicker
            mode="range"
            v-model:value="dateValue"
            @change="handleDateChange"
            @confirm="(val: any) => console.log('Confirmed:', val)"
            @cancel="() => console.log('Cancelled')"
            
            displayMode="popover"
            theme="light"
            primaryColor="#007aff"
            inputClass="custom-picker"
            :numberOfMonths="1"
            
            :minDate="new Date(2020, 0, 1)"
            :maxDate="new Date(2030, 11, 31)"
            
            format="YYYY-MM-DD"
            locale="en-US"
            :showTimePicker="true"
            :showSeconds="true"
            
            :inputStyle="{ fontWeight: '500' }"
            class="my-custom-trigger"
          />
        </div>
        <div class="result-box">
          Selected: {{ displayDateValue }}
        </div>
      </section>

      <section class="demo-card">
        <h2>iOS Wheel Picker</h2>
        <div class="picker-wrapper wheel-wrapper">
          <VueMomentumPicker
            mode="datetime"
            v-model:value="wheelValue"
            @change="handleWheelChange"
            @confirm="(date: any) => console.log('Confirmed:', date)"
            @cancel="() => console.log('Cancelled')"
            
            displayMode="inline"
            theme="light"
            pickerStyle="ios"
            primaryColor="#6750a4"
            :is3D="true"
            
            :itemHeight="36"
            :minuteStep="1"
            
            :minDate="new Date(2020, 0, 1)"
            :maxDate="new Date(2030, 11, 31)"
            
            format="YYYY-MM-DD"
            locale="en-US"
            
            :inputStyle="{ borderColor: '#6750a4', color: '#6750a4' }"
            inputClass="my-wheel-trigger"
          />
        </div>
        <div class="result-box">
          Selected: {{ wheelValue }}
        </div>
      </section>
    </main>
  </div>
</template>
