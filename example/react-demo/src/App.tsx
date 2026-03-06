import { useState } from 'react'
import { ReactMomentumPicker, ReactDatePicker } from '../../../src/index.ts';
import type { PickerValue } from '../../../src/index.ts'

// Import the CSS for the pickers
import '../../../src/styles/wheel.css'
import '../../../src/styles/calendar.css'

import './App.css'

function App() {
  const [dateValue, setDateValue] = useState<PickerValue>(new Date())
  const [wheelValue, setWheelValue] = useState<Date>(new Date())

  return (
    <div className="demo-container">
      <header className="demo-header">
        <h1>Momentum Picker React Demo</h1>
        <p>Testing the React wrappers for DatePicker and MomentumPicker</p>
      </header>

      <main className="demo-grid">
        <section className="demo-card">
          <h2>Calendar DatePicker</h2>
          <div className="picker-wrapper">
            <ReactDatePicker
              // --- Core Selection & Value ---
              mode="range"                 // "single" | "multiple" | "range" | "week" | "month" | "year" | "datetime-seconds"
              value={dateValue}
              onChange={(val, formatted) => {
                console.log('DatePicker Change:', val, formatted)
                setDateValue(val)
              }}
              onConfirm={(val) => console.log('Confirmed:', val)}
              onCancel={() => console.log('Cancelled')}
              
              // --- Display & Visibility ---
              displayMode="popover"          // "inline" | "popover" | "modal"
              theme="light"                 // "light" | "dark"
              primaryColor="#007aff"       // Primary brand color
              className="custom-picker"     // Custom class on the root
              numberOfMonths={1}            // Number of months to show (multi-month support)
              
              // --- Date Constraints ---
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date(2030, 11, 31)}
              disabledDates={(date) => date.getDay() === 0} // e.g., disable Sundays
              // disabledRanges={[[new Date(2024, 0, 10), new Date(2024, 0, 15)]]}
              
              // --- Formatting & Locale ---
              format="YYYY-MM-DD"           // Token-based format
              locale="en-US"                // BCP 47 locale
              weekStartsOn={0}              // 0 (Sun), 1 (Mon), 6 (Sat)
              showWeekNumbers={false}
              
              // --- Footer & Actions ---
              showToday={false}              // Show "Now" or "Today" button
              showClear={false}              // Show "Clear" button
              // showActions={true}            // Show "Done" / "Cancel" footer
              footerPosition="bottom"       // "top" | "bottom"
              presets={[                    // Quick-select presets
                { label: 'Today', value: new Date() },
                { label: 'Last Week', value: () => {
                   const d = new Date(); d.setDate(d.getDate() - 7); return d;
                }},
                { label: '-- Separator --', isDivider: true }
              ]}
              
              // --- Time Options ---
              showTimePicker={true}        // Force show time picker even if not in datetime mode
              showSeconds={true}           // Include seconds in time picker
              allowPaste={true}             // Allow pasting date strings (Ctrl+V)

              // --- React-specific Trigger UI (for Popover/Modal) ---
              inputStyle={{ fontWeight: '500' }}
              inputClassName="my-custom-trigger"
            />
          </div>
          <div className="result-box">
            Selected: {dateValue?.toString()}
          </div>
        </section>

        <section className="demo-card">
          <h2>iOS Wheel Picker</h2>
          <div className="picker-wrapper wheel-wrapper">
            <ReactMomentumPicker
              // --- Core Selection & Value ---
              mode="date"                // "date" | "time" | "datetime" (default)
              value={wheelValue}
              onChange={(date, formatted) => {
                console.log('Wheel Change:', date, formatted)
                setWheelValue(date)
              }}
              onConfirm={(date) => console.log('Confirmed:', date)}
              onCancel={() => console.log('Cancelled')}

              // --- Display & Visibility ---
              displayMode="modal"          // "inline" | "popover" | "modal"
              theme="light"                  // "light" | "dark"
              style="ios"               // "ios" | "material" | "neumorphism" | "frosted" | "glass"
              primaryColor="#6750a4"         // Primary brand color
              is3D={true}                    // Add 3D perspective to the wheel
              
              // --- Config ---
              itemHeight={36}                // Height of each item in the wheel
              minuteStep={1}                 // Step size for minute column

              // --- Date Constraints ---
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date(2030, 11, 31)}

              // --- Formatting & Locale ---
              format="YYYY-MM-DD HH:mm"
              locale="en-US"
              
              // --- Dimensional overrides ---
              width="100%"

              // --- React-specific Trigger UI (for Popover/Modal) ---
              inputStyle={{ borderColor: '#6750a4', color: '#6750a4' }}
              inputClassName="my-wheel-trigger"
            />
          </div>
          <div className="result-box">
            Selected: {wheelValue?.toLocaleString()}
          </div>
        </section>

      </main>
    </div>
  )
}

export default App
