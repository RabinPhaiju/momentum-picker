# API Reference

## MomentumPicker Class

### Constructor

```typescript
new MomentumPicker(options: PickerOptions)
```

---

## PickerOptions

Complete configuration object for initializing a picker.

### Mounting Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | — | CSS selector or element where picker mounts (required for modal/inline) |
| `anchor` | `string \| HTMLElement` | — | Trigger element for popover mode |

### Mode & Display

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'date' \| 'time' \| 'datetime'` | `'datetime'` | What to pick |
| `displayMode` | `'modal' \| 'popover' \| 'inline'` | `'modal'` | How to display |

### Values & Constraints

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `value` | `Date` | `new Date()` | Initial selected date |
| `minDate` | `Date \| null` | `null` | Earliest selectable date |
| `maxDate` | `Date \| null` | `null` | Latest selectable date |

### Formatting

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `string` | `null` | Output format (e.g., `'YYYY-MM-DD HH:mm'`) |
| `locale` | `string` | `navigator.language` | Locale for formatting (e.g., `'fr-FR'`) |

### Wheel Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minuteStep` | `number` | `1` | Minute increment in time picker |

### UI Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `itemHeight` | `number` | `44` | Height of each row (pixels) |
| `visibleRows` | `number` | `5` | Number of visible rows |
| `is3D` | `boolean` | `true` | Enable 3D perspective effect |

### Theming

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `theme` | `'light' \| 'dark'` | `'light'` | Color scheme |
| `style` | `string` | `'default'` | Visual style (see [Styles](#styles) below) |
| `primaryColor` | `string` (hex) | `'#007aff'` | Accent color |

### Event Handlers

| Option | Type | Description |
|--------|------|-------------|
| `onChange` | `(value: Date \| Date[], formatted?: string) => void` | Fires on value change (inline mode) |
| `onConfirm` | `(value: Date \| Date[], formatted?: string) => void` | Fires when user confirms selection |
| `onCancel` | `() => void` | Fires when user cancels |
| `onOpenChange` | `(isOpen: boolean) => void` | Fires when modal/popover opens/closes |

---

## Instance Methods

### `show()`

Display the picker (modal/popover mode only).

```typescript
picker.show(): void
```

**Example:**
```typescript
document.getElementById('btn').addEventListener('click', () => {
  picker.show();
});
```

---

### `hide()`

Hide the picker (modal/popover mode only).

```typescript
picker.hide(): void
```

---

### `toggle()`

Toggle visibility (popover mode).

```typescript
picker.toggle(): void
```

**Example:**
```typescript
document.getElementById('trigger').addEventListener('click', (e) => {
  e.stopPropagation();
  picker.toggle();
});
```

---

### `getValue()`

Get the currently selected value as a Date object.

```typescript
picker.getValue(): Date | Date[]
```

**Returns:**
- `Date` — for single/date/time pickers
- `Date[]` — for range/multiple pickers

**Example:**
```typescript
const selectedDate = picker.getValue();
console.log(selectedDate.toLocaleString()); // e.g., "3/15/2026, 2:30:00 PM"
```

---

### `setValue(value)`

Set the picker value programmatically.

```typescript
picker.setValue(value: Date | Date[]): void
```

**Parameters:**
- `value` — A Date or array of Dates

**Example:**
```typescript
// Set to March 15, 2026, 2:30 PM
picker.setValue(new Date(2026, 2, 15, 14, 30));
```

---

### `setOptions(partial)`

Update picker options after construction. **Reactive options only.**

```typescript
picker.setOptions(partial: Partial<PickerOptions>): this
```

**Reactive options:**
- `theme` — Switch between light/dark
- `style` — Change visual style
- `primaryColor` — Change accent color
- `is3D` — Toggle 3D effect

**Non-reactive options** (cannot be changed after init):
- `mode`, `displayMode`, `container`, `anchor`, `format`, `locale`

**Example:**
```typescript
// Change theme
picker.setOptions({ theme: 'dark' });

// Chain multiple updates
picker.setOptions({
  theme: 'dark',
  style: 'material',
  primaryColor: '#6750a4',
  is3D: false,
});
```

---

### `destroy()`

Remove the picker from DOM and clean up event listeners.

```typescript
picker.destroy(): void
```

**Example:**
```typescript
picker.destroy();
```

---

## Styles

Available values for the `style` option:

| Style | Preview |
|-------|---------|
| `'default'` | iOS-like clean design |
| `'neumorphism'` | Soft embossed 3D |
| `'brutalist'` | Bold monospace |
| `'retro'` | Windows 95 |
| `'gradient'` | Colorful gradients |
| `'pastel'` | Soft pastel colors |
| `'vibrant'` | Neon glowing |
| `'frosted'` | Glass morphism blur |
| `'elevated'` | Deep shadows |
| `'material'` | Material Design 3 |
| `'ios'` | Native iOS |
| `'macos'` | Native macOS |
| `'bootstrap'` | Bootstrap design |
| `'tailwind'` | Tailwind CSS |
| `'chakra'` | Chakra UI |
| `'ant'` | Ant Design |

```typescript
picker.setOptions({ style: 'material' });
```

---

## Format Strings

Format patterns for `format` option:

| Pattern | Example Output |
|---------|----------------|
| `'YYYY-MM-DD'` | `2026-03-15` |
| `'MM/DD/YYYY'` | `03/15/2026` |
| `'DD-MMM-YYYY'` | `15-Mar-2026` |
| `'YYYY-MM-DD HH:mm'` | `2026-03-15 14:30` |
| `'MM/DD/YYYY HH:mm'` | `03/15/2026 14:30` |
| `'HH:mm'` | `14:30` |
| `'HH:mm:ss'` | `14:30:45` |

---

## DatePicker Class

Similar to MomentumPicker, but for calendar grid display.

### Constructor

```typescript
new DatePicker(options: DatePickerOptions)
```

### Additional DatePicker Modes

| Mode | Description |
|------|-------------|
| `'single'` | Pick one date |
| `'range'` | Pick start and end date |
| `'multiple'` | Pick multiple non-contiguous dates |
| `'week'` | Pick an entire week |
| `'month'` | Pick month |
| `'year'` | Pick year |

### Additional DatePicker Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `weekStartsOn` | `number` | `0` | Week start day (0 = Sunday, 1 = Monday) |
| `showWeekNumbers` | `boolean` | `false` | Show week numbers |
| `showToday` | `boolean` | `false` | Show "Today" button |
| `showClear` | `boolean` | `false` | Show "Clear" button |
| `showActions` | `boolean` | `true` | Show Confirm/Cancel buttons |
| `disabledDates` | `(date: Date) => boolean` | — | Function to disable specific dates |
| `renderDay` | `(date: Date, info: DayInfo) => string \| null` | — | Custom day cell renderer |

**Example:**
```typescript
const datePicker = new DatePicker({
  mode: 'range',
  weekStartsOn: 1,  // Monday
  showWeekNumbers: true,
  disabledDates: (date) => date.getDay() === 0 || date.getDay() === 6, // Disable weekends
});
```

---

## CSS Custom Properties

Override any design token:

```css
/* These can be set on any container with a MomentumPicker */
.my-picker {
  --mp-primary: #007aff;              /* Primary accent */
  --mp-bg: #ffffff;                   /* Background */
  --mp-surface: #f2f2f7;              /* Surface (secondary bg) */
  --mp-text: #000000;                 /* Text color */
  --mp-text-muted: #8e8e93;           /* Muted text */
  --mp-border: rgba(60, 60, 67, 0.12);/* Border color */
  --mp-overlay: rgba(0, 0, 0, 0.4);   /* Overlay backdrop */
  --mp-selection-bg: rgba(118, 118, 128, 0.12); /* Selection highlight */
  
  --mp-item-height: 44px;             /* Row height */
  --mp-visible-rows: 5;               /* Visible rows */
  --mp-border-radius: 20px;           /* Corner radius */
  --mp-header-height: 52px;           /* Header height */
  
  --mp-font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  --mp-font-size-item: 21px;          /* Item text size */
  --mp-font-size-header: 17px;        /* Header text size */
  --mp-font-weight-item: 400;         /* Item font weight */
  --mp-font-weight-selected: 500;     /* Selected item weight */
  
  --mp-transition-speed: 250ms;       /* Animation duration */
  --mp-glass-blur: 12px;              /* Blur amount (for glass style) */
}
```

**Usage:**
```typescript
const picker = new MomentumPicker({
  container: '.my-picker',
  primaryColor: '#6750a4',
  // Other options...
});
```

---

## Event Callback Signatures

### `onChange`

Fired when value changes (inline mode).

```typescript
onChange?: (value: Date | Date[], formatted?: string) => void
```

### `onConfirm`

Fired when user confirms selection.

```typescript
onConfirm?: (value: Date | Date[], formatted?: string) => void
```

### `onCancel`

Fired when user cancels.

```typescript
onCancel?: () => void
```

### `onOpenChange`

Fired when picker opens/closes (modal/popover).

```typescript
onOpenChange?: (isOpen: boolean) => void
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll wheel column |
| `→` | Move to next column |
| `←` | Move to previous column |
| `Enter` | Confirm selection |
| `Escape` | Cancel (modal/popover) |

### ARIA Attributes

Automatically included:
- `role="dialog"` on overlay
- `aria-modal="true"` on modal
- `role="listbox"` on columns
- `role="option"` on items
- `aria-selected="true/false"` on items

---

## TypeScript Types

### PickerOptions

```typescript
interface PickerOptions {
  container?: string | HTMLElement;
  anchor?: string | HTMLElement;
  mode: 'date' | 'time' | 'datetime';
  displayMode?: 'modal' | 'popover' | 'inline';
  value?: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
  minuteStep?: number;
  format?: string | null;
  locale?: string;
  theme?: 'light' | 'dark';
  style?: string;
  primaryColor?: string;
  itemHeight?: number;
  visibleRows?: number;
  is3D?: boolean;
  onChange?: (value: Date | Date[], formatted?: string) => void;
  onConfirm?: (value: Date | Date[], formatted?: string) => void;
  onCancel?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}
```

### DatePickerOptions

```typescript
interface DatePickerOptions extends PickerOptions {
  mode: 'single' | 'range' | 'multiple' | 'week' | 'month' | 'year';
  displayMode?: 'inline' | 'popover' | 'modal';
  
  // Selection
  value?: PickerValue;             // Date | [Date, Date] | Date[]
  defaultValue?: PickerValue;
  minDate?: Date | null;
  maxDate?: Date | null;
  disabledDates?: (date: Date) => boolean;
  disabledRanges?: [Date, Date][];
  
  // Formatting & Locale
  format?: string | null;
  locale?: string;
  weekStartsOn?: number;           // 0 = Sunday, 1 = Monday
  showWeekNumbers?: boolean;
  
  // UI Features
  showToday?: boolean;
  showClear?: boolean;
  showActions?: boolean;
  showTimePicker?: boolean;        // Add time selection inputs
  showSeconds?: boolean;
  allowPaste?: boolean;            // Detect clipboard paste
  
  // Header & Footer
  renderHeader?: (date: Date) => string | HTMLElement;
  renderDay?: (date: Date, info: DayRenderInfo) => string | HTMLElement;
  presets?: DatePreset[];          // [{ label: 'Today', getValue: () => Date }]
  footerButtons?: FooterButton[];  // Custom buttons in footer
  footerPosition?: 'bottom' | 'top';

  // State Management
  open?: boolean;
  defaultOpen?: boolean;
  
  // Callbacks
  onChange?: (val: PickerValue) => void;
  onConfirm?: (val: PickerValue) => void;
  onCancel?: () => void;
  onValidate?: (val: PickerValue) => string | null; // Custom validation
  onOpenChange?: (open: boolean) => void;
}
```

---

## Examples by Use Case

### Single Date Selection
```typescript
new MomentumPicker({
  mode: 'date',
  format: 'YYYY-MM-DD',
});
```

### Time with 15-minute steps
```typescript
new MomentumPicker({
  mode: 'time',
  minuteStep: 15,
  format: 'HH:mm',
});
```

### Date + Time
```typescript
new MomentumPicker({
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
});
```

### Dark Mode
```typescript
new MomentumPicker({
  theme: 'dark',
});
```

### Custom Styling
```typescript
new MomentumPicker({
  style: 'material',
  primaryColor: '#6750a4',
});
```

### With Constraints
```typescript
new MomentumPicker({
  minDate: new Date(),  // No past dates
  maxDate: new Date(Date.now() + 86400000 * 30),  // 30 days max
});
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Core | ✅ | ✅ | ✅ | ✅ |
| Touch | ✅ | ✅ | ✅ | ✅ |
| 3D Transforms | ✅ | ✅ | ✅ (11+) | ✅ |
| CSS Variables | ✅ | ✅ | ✅ (9.1+) | ✅ |
| Backdrop Filter | ✅ | ❌* | ✅ | ✅ |

\* Firefox does not support `backdrop-filter`. Glass style falls back to solid background.

---

## Performance Tips

1. **Reuse pickers** — Create once, show/hide multiple times
2. **Lazy load** — Create pickers only when needed
3. **Batch updates** — Use `setOptions()` to update multiple properties at once
4. **Destroy unused** — Call `destroy()` when picker is no longer needed

---

## Troubleshooting

### Picker not showing
- Check `container` element exists
- Ensure CSS is imported
- For modal: `container` must be in `document.body`

### Theme not switching
- Use `setOptions({ theme: 'dark' })`
- Check `data-mp-theme` attribute on element

### Touch not working
- Ensure `touch-action: none` isn't blocked by parent
- Check for event listener conflicts

### 3D effect not visible
- Browser must support CSS 3D transforms
- Check `is3D: true` option

---

## React Components

Both pickers are fully supported in React via wrapper components. They accept all Vanilla JS configuration options as props, alongside React-specific additions.

### `<ReactMomentumPicker />` (Wheel)

**Props:**
Extends all `PickerOptions` except `container`.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Control visibility programmatically (for modal/popover) |
| `value` | `Date` | Selected date |
| `onChange` | `(date: Date, formatted?: string) => void` | Triggered on every scroll |
| `onConfirm` | `(date: Date, formatted?: string) => void` | Triggered on "Done" button |
| `onCancel` | `() => void` | Triggered on "Cancel" or outside click |
| `inputClassName` | `string` | Custom class for default trigger input |
| `inputStyle` | `CSSProperties` | Custom inline styles for default trigger input |
| `children` | `React.ReactNode` | If provided, replaces the default input trigger |

**Example:**
```tsx
<ReactMomentumPicker
  mode="datetime"
  value={myDate}
  onChange={setDate}
  displayMode="popover"
  theme="light"
  style="material"
  primaryColor="#6750a4"
  is3D={true}
  minuteStep={15}
  inputStyle={{ borderColor: '#6750a4' }}
/>
```

### `<ReactDatePicker />` (Calendar)

**Props:**
Extends all `DatePickerOptions` except `container`.

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Control visibility programmatically |
| `value` | `PickerValue` | `Date` \| `[Date, Date]` \| `Date[]` |
| `onChange` | `(value: PickerValue, formatted?: string | string[]) => void` | Triggered when selection changes |
| `inputClassName` | `string` | Custom class for default trigger input |
| `inputStyle` | `CSSProperties` | Custom inline styles for default trigger input |
| `children` | `React.ReactNode` | Custom trigger element |

**Example:**
```tsx
<ReactDatePicker
  mode="range"
  value={myDateRange}
  onChange={setRange}
  displayMode="popover"
  theme="dark"
  primaryColor="#ff3b30"
  numberOfMonths={2}
  format="MM/DD/YYYY"
  showTimePicker={true}
/>
```

### Custom Trigger Elements

By default, non-inline components render a styled `<input />` to act as a trigger. You can override this by passing `children`:

```tsx
<ReactMomentumPicker mode="date" displayMode="modal">
  <button className="my-custom-btn">🗓️ Select Date</button>
</ReactMomentumPicker>
```

---

For more examples, see [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)
