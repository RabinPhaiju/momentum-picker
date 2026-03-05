# momentum-picker Complete Documentation

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Picker Types](#picker-types)
4. [Display Modes](#display-modes)
5. [API Reference](#api-reference)
6. [Theming](#theming)
7. [Styling & Themes](#styling--themes)
8. [Examples](#examples)
9. [Advanced Usage](#advanced-usage)

---

## Installation

### NPM

```bash
npm install momentum-picker
```

### Import

```typescript
import { MomentumPicker, DatePicker } from 'momentum-picker';
import 'momentum-picker/style.css';
```

### CDN (UMD)

```html
<link rel="stylesheet" href="https://unpkg.com/momentum-picker/dist/style.css">
<script src="https://unpkg.com/momentum-picker/dist/index.umd.js"></script>
<script>
  const { MomentumPicker, DatePicker } = window.momentumPicker;
</script>
```

---

## Getting Started

### Basic Example - iOS Wheel Picker

```typescript
const picker = new MomentumPicker({
  container: '#modal-mount', // Where to mount the picker
  mode: 'datetime',          // 'date' | 'time' | 'datetime'
  displayMode: 'modal',      // 'modal' | 'popover' | 'inline'
  value: new Date(),         // Initial date
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date, formatted) => {
    console.log('Selected:', formatted); // "2026-03-05 14:30"
  },
  onCancel: () => {
    console.log('Cancelled');
  },
});

// Show the picker
picker.show();
```

### Basic Example - Calendar Picker

```typescript
const datePicker = new DatePicker({
  container: '#my-calendar',
  displayMode: 'inline',     // Shows permanently
  mode: 'single',            // 'single' | 'range' | 'multiple' | 'week' | 'month' | 'year'
  format: 'YYYY-MM-DD',
  onChange: (date, formatted) => {
    console.log('Date changed:', formatted);
  },
});
```

---

## Picker Types

### MomentumPicker (iOS-style Wheel)

**Modes:**

- `date` — Year, Month, Day columns
- `time` — Hour, Minute columns (with customizable step)
- `datetime` — All 5 columns (Year, Month, Day, Hour, Minute)

**Time separator:** A colon (`:`) automatically appears between Hour and Minute columns in all styles.

```typescript
// Time picker with 5-minute step
const timePicker = new MomentumPicker({
  mode: 'time',
  minuteStep: 5,  // Default: 1
  format: 'HH:mm',
});
```

### DatePicker (Calendar Grid)

**Modes:**

- `single` — Single date selection
- `range` — Date range (start & end)
- `multiple` — Multiple non-contiguous dates
- `week` — Select an entire week
- `month` — Month selection
- `year` — Year selection

```typescript
const weekPicker = new DatePicker({
  mode: 'week',
  weekStartsOn: 1,  // 0 = Sunday, 1 = Monday
  showWeekNumbers: true,
});
```

---

## Display Modes

### 1. Modal (Full-screen Overlay)

Covers the entire screen with a dark backdrop. Perfect for pickers that need focus.

```typescript
const picker = new MomentumPicker({
  displayMode: 'modal',
  container: '#modal-mount', // Must be in document.body
});

picker.show();
picker.hide();
```

**Keyboard:** Press `Escape` to dismiss.

### 2. Popover (Anchored to Element)

Appears next to a trigger element with smart positioning (auto-flip if near screen edge).

```typescript
const picker = new MomentumPicker({
  displayMode: 'popover',
  anchor: '#date-input',  // Anchor element selector or HTMLElement
});

// Toggle on button click
document.getElementById('trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  picker.toggle();
});
```

**Features:**
- Smart positioning (flips if too close to edge)
- Closes on outside click
- No backdrop

### 3. Inline (Permanent Display)

Picker visible at all times inside a container. Updates happen live with `onChange` events.

```typescript
const picker = new MomentumPicker({
  displayMode: 'inline',
  container: '#picker-container',
  onChange: (date, formatted) => {
    console.log('Live update:', formatted);
  },
});

picker.show(); // Still required to initialize
```

**Use cases:** Embedded in forms, dashboards, or custom layouts.

---

## API Reference

### Constructor Options

```typescript
interface PickerOptions {
  // Mounting
  container?: string | HTMLElement;  // Where to mount
  anchor?: string | HTMLElement;     // For popover mode (trigger element)

  // Mode & Display
  mode: 'date' | 'time' | 'datetime';
  displayMode?: 'modal' | 'popover' | 'inline'; // Default: 'modal'

  // Initial Value
  value?: Date;                       // Default: new Date()
  minDate?: Date | null;
  maxDate?: Date | null;

  // Formatting
  format?: string;                    // e.g., 'YYYY-MM-DD HH:mm'
  locale?: string;                    // e.g., 'fr-FR' (navigator.language)

  // Wheel Config (MomentumPicker only)
  minuteStep?: number;                // Default: 1

  // UI
  primaryColor?: string;              // Accent color (hex)
  itemHeight?: number;                // Default: 44px
  visibleRows?: number;               // Default: 5
  is3D?: boolean;                     // Default: true

  // Theme & Style
  theme?: 'light' | 'dark';           // Default: 'light'
  style?: string;                     // See Styling section

  // Callbacks
  onChange?: (value: Date | Date[], formatted?: string) => void;
  onConfirm?: (value: Date | Date[], formatted?: string) => void;
  onCancel?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}
```

### Methods

#### `show()`

Display the picker (modal/popover mode).

```typescript
picker.show();
```

#### `hide()`

Hide the picker (modal/popover mode).

```typescript
picker.hide();
```

#### `toggle()`

Toggle visibility (popover mode).

```typescript
picker.toggle();
```

#### `getValue()`

Get the current selected value.

```typescript
const date = picker.getValue(); // Date object
```

#### `setValue(date)`

Set the picker value programmatically.

```typescript
picker.setValue(new Date(2026, 2, 15)); // March 15, 2026
```

#### `setOptions(partial)`

Update picker options after construction (e.g., switch theme).

```typescript
picker.setOptions({
  theme: 'dark',
  primaryColor: '#34c759',
  is3D: false,
});
```

**Reactive options:** `theme`, `style`, `primaryColor`, `is3D`

#### `destroy()`

Remove the picker and clean up event listeners.

```typescript
picker.destroy();
```

---

## Theming

### Light / Dark Mode

The picker automatically inherits light/dark mode from the `theme` option.

```typescript
// Create with dark theme
const picker = new MomentumPicker({
  theme: 'dark', // or 'light'
});

// Switch theme at runtime
picker.setOptions({ theme: 'dark' });
```

**This affects:**
- Background colors
- Text colors
- Borders and shadows
- Selection indicator styling

### Automatic Dark Mode Detection

```typescript
// Detect user's system preference
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const picker = new MomentumPicker({
  theme: isDark ? 'dark' : 'light',
});
```

### Switching Theme for All Pickers

```typescript
const allPickers = [picker1, picker2, picker3];

function setGlobalTheme(theme) {
  allPickers.forEach(p => p.setOptions({ theme }));
}

// Listen to theme toggle button
document.getElementById('theme-btn').addEventListener('click', () => {
  const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  document.body.classList.toggle('dark', newTheme === 'dark');
  setGlobalTheme(newTheme);
});
```

---

## Styling & Themes

### Built-in Styles

The `style` option changes the visual appearance of the picker:

| Style | Description |
|-------|-------------|
| `default` | iOS-like clean design (default) |
| `neumorphism` | Soft, embossed 3D effect |
| `brutalist` | Bold, monospace, high contrast |
| `retro` | Windows 95 aesthetic |
| `gradient` | Colorful gradient backgrounds |
| `pastel` | Soft, cute pastel colors |
| `vibrant` | Neon glowing effect |
| `frosted` | Glass morphism (blur + transparency) |
| `elevated` | Prominent shadow depth |
| `material` | Material Design 3 (M3) |
| `ios` | Native iOS look |
| `macos` | Native macOS look |
| `bootstrap` | Bootstrap design system |
| `tailwind` | Tailwind CSS aesthetics |
| `chakra` | Chakra UI colors |
| `ant` | Ant Design |

```typescript
const picker = new MomentumPicker({
  style: 'material', // Switch to Material Design
});

// Change style at runtime
picker.setOptions({ style: 'brutalist' });
```

### Custom Styling via CSS Variables

Override any design token:

```css
.my-picker {
  --mp-primary: #6750a4;        /* Primary accent color */
  --mp-bg: #f7f2fa;             /* Background */
  --mp-text: #1c1c1e;           /* Text color */
  --mp-selection-bg: #eaddff;   /* Selection highlight */
  --mp-border-radius: 28px;     /* Corner roundness */
  --mp-item-height: 48px;       /* Row height */
  --mp-visible-rows: 6;         /* Visible rows */
  --mp-transition-speed: 300ms; /* Animation speed */
}
```

Then pass the container to the picker:

```typescript
const picker = new MomentumPicker({
  container: '.my-picker',
  primaryColor: '#6750a4',
});
```

### Primary Color

```typescript
const picker = new MomentumPicker({
  primaryColor: '#ff3b30', // iOS Red
});

// Change color dynamically
picker.setOptions({ primaryColor: '#34c759' }); // iOS Green
```

---

## Examples

### Example 1: Simple Date Selection (Modal)

```typescript
const datePicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'date',
  displayMode: 'modal',
  format: 'YYYY-MM-DD',
  onConfirm: (date, formatted) => {
    console.log('Selected date:', formatted);
  },
});

document.getElementById('open-date-btn').addEventListener('click', () => {
  datePicker.show();
});
```

### Example 2: Time Picker with 15-min Step

```typescript
const timePicker = new MomentumPicker({
  container: '#modal-mount',
  mode: 'time',
  displayMode: 'modal',
  minuteStep: 15,
  format: 'HH:mm',
  onConfirm: (date, formatted) => {
    document.getElementById('time-input').value = formatted;
  },
});

document.getElementById('time-btn').addEventListener('click', () => {
  timePicker.show();
});
```

### Example 3: Popover Picker (Anchored to Input)

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
```

### Example 4: Inline Picker (Always Visible)

```html
<div id="inline-picker" style="max-height: 250px; border: 1px solid #ccc;"></div>
<p>Selected: <span id="result">—</span></p>
```

```typescript
const picker = new MomentumPicker({
  container: '#inline-picker',
  displayMode: 'inline',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  onChange: (date, formatted) => {
    document.getElementById('result').textContent = formatted;
  },
});

picker.show(); // Initialize inline mode
```

### Example 5: Dark Mode Toggle (All Pickers)

```typescript
const allWheels = [picker1, picker2, picker3];

let isDark = false;

document.getElementById('theme-toggle').addEventListener('click', () => {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  
  allWheels.forEach(wheel => {
    wheel.setOptions({ theme: isDark ? 'dark' : 'light' });
  });
});
```

### Example 6: Range Date Selection (Calendar)

```typescript
const rangePicker = new DatePicker({
  container: '#calendar',
  displayMode: 'inline',
  mode: 'range',
  showActions: false,
  format: 'YYYY-MM-DD',
  onChange: (dates, formatted) => {
    if (Array.isArray(dates) && dates[0] && dates[1]) {
      console.log(`Range: ${formatted[0]} to ${formatted[1]}`);
    }
  },
});
```

### Example 7: Custom Styling (Material Design)

```typescript
const picker = new MomentumPicker({
  container: '#modal-mount',
  style: 'material',
  mode: 'datetime',
  primaryColor: '#6750a4',
  onConfirm: (date, formatted) => {
    console.log('Date & Time:', formatted);
  },
});
```

---

## Advanced Usage

### 1. Synced Pickers

Keep multiple pickers in sync:

```typescript
const minPicker = new MomentumPicker({
  mode: 'date',
  onConfirm: (date) => {
    maxPicker.setOptions({ minDate: date });
  },
});

const maxPicker = new MomentumPicker({
  mode: 'date',
  onConfirm: (date) => {
    minPicker.setOptions({ maxDate: date });
  },
});
```

### 2. Custom Formatting

Use the `format` option to customize output:

```typescript
// Date formats
'YYYY-MM-DD'       // 2026-03-15
'MM/DD/YYYY'       // 03/15/2026
'DD-MMM-YYYY'      // 15-Mar-2026
'YYYY-MM-DD'       // ISO format

// DateTime formats
'YYYY-MM-DD HH:mm'     // 2026-03-15 14:30
'MM/DD/YYYY h:mmA'     // 03/15/2026 2:30PM
'YYYY-MM-DD HH:mm:ss'  // 2026-03-15 14:30:45
```

### 3. Conditional Constraints

```typescript
const today = new Date();
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

const picker = new MomentumPicker({
  minDate: today,        // Cannot select past dates
  maxDate: nextMonth,    // Cannot select beyond 1 month
});
```

### 4. Responsive Behavior

```typescript
// Use popover on mobile, modal on desktop
const isMobile = () => window.innerWidth < 768;

const picker = new MomentumPicker({
  displayMode: isMobile() ? 'popover' : 'modal',
  anchor: isMobile() ? '#trigger-btn' : undefined,
  container: isMobile() ? undefined : '#modal-mount',
});
```

### 5. 3D Toggle

```typescript
let is3D = true;

document.getElementById('3d-toggle').addEventListener('click', () => {
  is3D = !is3D;
  picker.setOptions({ is3D });
});
```

### 6. Batch Update Options

```typescript
picker.setOptions({
  theme: 'dark',
  style: 'material',
  primaryColor: '#6750a4',
  is3D: false,
});
```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest |
| Firefox | ✅ Latest |
| Safari | ✅ Latest (iOS 13+) |
| Edge | ✅ Latest |
| Opera | ✅ Latest |

---

## Accessibility (ARIA)

The picker includes:

- ✅ ARIA listbox roles
- ✅ ARIA option roles
- ✅ Keyboard navigation (Arrow keys, Enter, Escape)
- ✅ Screen reader announcements
- ✅ Focus management
- ✅ High contrast support

```typescript
const picker = new MomentumPicker({
  // Automatically includes ARIA labels
  // No additional config needed
});
```

---

## License

MIT — See [LICENSE](LICENSE) for details.

---

## Support

For bugs, feature requests, or questions:
- GitHub: [momentum-picker](https://github.com/your-org/momentum-picker)
- Issues: [GitHub Issues](https://github.com/your-org/momentum-picker/issues)
