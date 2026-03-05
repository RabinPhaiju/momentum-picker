# Quick Usage Examples

## Copy & Paste Ready Examples

### 1. Modal Date Picker

```typescript
import { MomentumPicker } from 'momentum-picker';
import 'momentum-picker/style.css';

const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  format: 'YYYY-MM-DD',
  onConfirm: (date, formatted) => {
    console.log('Selected:', formatted);
  },
  onCancel: () => console.log('Cancelled'),
});

document.getElementById('btn-date').addEventListener('click', () => {
  picker.show();
});
```

**HTML:**
```html
<button id="btn-date">📅 Pick a Date</button>
<div id="modal-mount"></div>
```

---

### 2. Modal Time Picker (with 5-min steps)

```typescript
const timePicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'time',
  minuteStep: 5,
  format: 'HH:mm',
  onConfirm: (date, formatted) => {
    document.getElementById('time-result').textContent = formatted;
  },
});

document.getElementById('btn-time').addEventListener('click', () => {
  timePicker.show();
});
```

---

### 3. Popover Picker on Input

```typescript
const input = document.getElementById('date-input');

const picker = new MomentumPicker({
  anchor: input,
  displayMode: 'popover',
  mode: 'date',
  format: 'MM/DD/YYYY',
  onConfirm: (date, formatted) => {
    input.value = formatted;
  },
});

input.addEventListener('click', (e) => {
  e.stopPropagation();
  picker.toggle();
});

// Close on outside click
document.addEventListener('click', () => {
  picker.hide();
});
```

**HTML:**
```html
<input type="text" id="date-input" placeholder="Click to select date" readonly>
```

---

### 4. Inline Picker (Always Visible)

```typescript
const inlinePicker = new MomentumPicker({
  container: '#inline-picker',
  displayMode: 'inline',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  onChange: (date, formatted) => {
    document.getElementById('selected-dt').textContent = formatted;
  },
});

inlinePicker.show();
```

**HTML:**
```html
<div id="inline-picker" style="max-height: 300px; border: 1px solid #ccc;"></div>
<p>Selected: <strong id="selected-dt">—</strong></p>
```

---

### 5. Dark Mode Toggle (All Pickers)

```typescript
const allPickers = [picker1, picker2, picker3];
let isDark = false;

document.getElementById('theme-btn').addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  
  allPickers.forEach(p => {
    p.setOptions({ theme: isDark ? 'dark' : 'light' });
  });
  
  document.getElementById('theme-btn').textContent = isDark ? '☀️' : '🌙';
});
```

---

### 6. DateTime Picker (Modal + Dark Theme)

```typescript
const dtPicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  displayMode: 'modal',
  theme: 'dark',
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    alert(`Selected: ${formatted}`);
  },
});

document.getElementById('btn-dt').addEventListener('click', () => {
  dtPicker.show();
});
```

---

### 7. Multiple Pickers (Different Modes)

```typescript
// Date Picker
const datePicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  onConfirm: (date) => updateResult('date', date),
});

// Time Picker
const timePicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'time',
  onConfirm: (date) => updateResult('time', date),
});

// DateTime Picker
const dtPicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  onConfirm: (date) => updateResult('datetime', date),
});

function updateResult(type, date) {
  console.log(`${type}:`, date.toLocaleString());
}

// Buttons to trigger each picker
document.getElementById('btn-date').addEventListener('click', () => datePicker.show());
document.getElementById('btn-time').addEventListener('click', () => timePicker.show());
document.getElementById('btn-dt').addEventListener('click', () => dtPicker.show());
```

---

### 8. Picker with Custom Constraints

```typescript
const today = new Date();
const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  minDate: today,        // No dates in the past
  maxDate: maxDate,      // Max 3 months from now
  format: 'YYYY-MM-DD',
});
```

---

### 9. Styled Picker (Material Design)

```typescript
const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  style: 'material',
  primaryColor: '#6750a4',
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    console.log('Selected:', formatted);
  },
});
```

---

### 10. Style Switcher

```typescript
const styles = [
  'default', 'material', 'brutalist', 'retro',
  'gradient', 'pastel', 'neumorphism', 'vibrant'
];

const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
});

document.getElementById('style-select').addEventListener('change', (e) => {
  picker.setOptions({ style: e.target.value });
});
```

**HTML:**
```html
<select id="style-select">
  <option value="default">Default</option>
  <option value="material">Material</option>
  <option value="brutalist">Brutalist</option>
  <option value="retro">Retro</option>
  <option value="gradient">Gradient</option>
  <option value="pastel">Pastel</option>
</select>
```

---

### 11. Show Selected Value in Result Box

```typescript
const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    const resultEl = document.getElementById('result');
    resultEl.innerHTML = `✅ Selected: <em>${formatted}</em>`;
  },
  onCancel: () => {
    document.getElementById('result').innerHTML = '❌ Cancelled';
  },
});

document.getElementById('open-picker').addEventListener('click', () => {
  picker.show();
});
```

**HTML:**
```html
<button id="open-picker">Open Picker</button>
<div id="result" style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px;">
  Waiting…
</div>
```

---

### 12. Calendar Picker (DatePicker - Single Mode)

```typescript
import { DatePicker } from 'momentum-picker';

const calendarPicker = new DatePicker({
  container: '#calendar',
  displayMode: 'inline',
  mode: 'single',
  format: 'YYYY-MM-DD',
  showToday: true,
  showClear: true,
  onChange: (date, formatted) => {
    console.log('Date selected:', formatted);
  },
});
```

**HTML:**
```html
<div id="calendar"></div>
```

---

### 13. Range Picker (DatePicker - Range Mode)

```typescript
import { DatePicker } from 'momentum-picker';

const rangePicker = new DatePicker({
  container: '#range-calendar',
  displayMode: 'inline',
  mode: 'range',
  format: 'YYYY-MM-DD',
  onChange: (dates, formatted) => {
    if (Array.isArray(dates) && dates[0] && dates[1]) {
      console.log(`Range: ${formatted[0]} to ${formatted[1]}`);
    }
  },
});
```

---

### 14. Advanced DatePicker (Time + Presets)

```typescript
import { DatePicker } from 'momentum-picker';

const advancedPicker = new DatePicker({
  container: '#advanced-picker',
  displayMode: 'inline',
  mode: 'range',
  showTimePicker: true,
  presets: [
    { label: 'Today', getValue: () => [new Date(), new Date()] },
    { label: 'This Week', getValue: () => {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        return [start, new Date()];
      }
    }
  ],
  footerPosition: 'top',
  onConfirm: (val) => console.log('Confirmed range:', val),
});
```

---

### 15. Form Integration with Hidden Input

```typescript
const form = document.getElementById('booking-form');

const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    document.getElementById('booking-date').value = formatted;
    picker.hide();
  },
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const dateStr = document.getElementById('booking-date').value;
  console.log('Form submitted with date:', dateStr);
});

document.getElementById('select-date-btn').addEventListener('click', () => {
  picker.show();
});
```

**HTML:**
```html
<form id="booking-form">
  <button type="button" id="select-date-btn">Select Date & Time</button>
  <input type="hidden" id="booking-date">
  <button type="submit">Book</button>
</form>
```

---

### 15. Responsive Picker (Mobile-friendly)

```typescript
const isMobile = () => window.innerWidth < 768;

const picker = new MomentumPicker({
  displayMode: isMobile() ? 'popover' : 'modal',
  anchor: isMobile() ? '#date-input' : undefined,
  container: isMobile() ? undefined : '#modal-mount',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
});

window.addEventListener('resize', () => {
  picker.setOptions({
    displayMode: isMobile() ? 'popover' : 'modal',
  });
});
```

---

## Tips & Tricks

### Get Current Value

```typescript
const currentDate = picker.getValue();
console.log(currentDate); // Date object
```

### Set Value Programmatically

```typescript
picker.setValue(new Date(2026, 4, 15, 14, 30)); // May 15, 2026 at 2:30 PM
```

### Update Multiple Options at Once

```typescript
picker.setOptions({
  theme: 'dark',
  style: 'material',
  primaryColor: '#6750a4',
  is3D: true,
});
```

### Destroy Picker (Clean Up)

```typescript
picker.destroy();
```

### Listen to Open/Close Events

```typescript
const picker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  onOpenChange: (isOpen) => {
    console.log('Picker is', isOpen ? 'open' : 'closed');
  },
});
```

---

## Common Patterns

### Pattern: Birthday Picker

```typescript
const today = new Date();
const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

const birthdayPicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  maxDate: maxDate,  // Must be at least 18 years old
  format: 'YYYY-MM-DD',
  onConfirm: (date, formatted) => {
    console.log('Birthday:', formatted);
  },
});
```

### Pattern: Appointment Time Picker

```typescript
const appointmentPicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'datetime',
  minuteStep: 15,  // 15-minute intervals
  minDate: new Date(), // No past dates
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    console.log('Appointment:', formatted);
  },
});
```

### Pattern: Countdown Timer (5-min alert before appointment)

```typescript
function scheduleReminder(appointmentDate) {
  const now = new Date();
  const timeUntil = appointmentDate.getTime() - now.getTime();
  const reminderTime = timeUntil - (5 * 60 * 1000); // 5 minutes before

  if (reminderTime > 0) {
    setTimeout(() => {
      alert('Appointment reminder: 5 minutes!');
    }, reminderTime);
  }
}

// After user confirms appointment
const appointmentPicker = new MomentumPicker({
  onConfirm: (date) => {
    scheduleReminder(date);
  },
});
```

---

**For more detailed documentation, see [DOCS.md](DOCS.md)**
