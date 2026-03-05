# momentum-picker 🎡

> A smooth, iOS-style wheel DateTime picker for the web.  
> Zero dependencies · Vanilla TypeScript · Touch + Mouse · Fully Accessible

[![npm](https://img.shields.io/npm/v/momentum-picker)](https://www.npmjs.com/package/momentum-picker)
[![license](https://img.shields.io/npm/l/momentum-picker)](LICENSE)
[![bundle size](https://img.shields.io/bundlephobia/minzip/momentum-picker)](https://bundlephobia.com/package/momentum-picker)

---

## Features

- 🎡 **Smooth wheel columns** — exact iOS feel with infinite scroll illusion
- ⚡ **Momentum scrolling** — natural inertia + snap-to-item
- 📅 **Three modes** — `date`, `time`, `datetime`
- 🖱️ **Touch & Mouse** — works on mobile and desktop
- 🌙 **Light / Dark** theme out of the box
- 🎨 **CSS variables** — one-line customisation
- ♿ **Accessible** — ARIA listbox/option roles, keyboard navigation, focus management
- 🔌 **Framework-agnostic** — React + Vue wrappers included
- 📦 **ESM + CJS** — works everywhere

---

## Installation

```bash
npm install momentum-picker
# or
pnpm add momentum-picker
# or
yarn add momentum-picker
```

---

## Quick Start

### Vanilla JavaScript / TypeScript

```ts
import MomentumPicker from 'momentum-picker';
import 'momentum-picker/style.css';

const picker = new MomentumPicker({
  container: '#app',        // CSS selector or HTMLElement
  mode: 'datetime',
  value: new Date(),
  format: 'YYYY-MM-DD HH:mm',
  onChange: (date, formatted) => {
    console.log('Changed:', formatted);
  },
  onConfirm: (date, formatted) => {
    console.log('Confirmed:', formatted);
    picker.hide();
  },
  onCancel: () => picker.hide(),
});

picker.show();
```

### React

```tsx
import { useState } from 'react';
import MomentumPickerReact from 'momentum-picker/react'; // Community wrapper

function App() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date());

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Picker</button>
      <MomentumPickerReact
        isOpen={open}
        mode="datetime"
        value={date}
        onConfirm={(d) => { setDate(d); setOpen(false); }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
```

### Vue 3

```vue
<template>
  <button @click="open = true">Open Picker</button>
  <MomentumPickerVue
    :is-open="open"
    mode="datetime"
    :value="date"
    @confirm="onConfirm"
    @cancel="open = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MomentumPickerVue from 'momentum-picker/vue';

const open = ref(false);
const date = ref(new Date());
const onConfirm = (d: Date) => { date.value = d; open.value = false; };
</script>
```

---

## API Reference

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string \| HTMLElement` | **required** | Mount target (CSS selector or element) |
| `mode` | `"date" \| "time" \| "datetime"` | `"datetime"` | Picker mode |
| `value` | `Date` | `new Date()` | Initial selected value |
| `minDate` | `Date` | — | Minimum selectable date |
| `maxDate` | `Date` | — | Maximum selectable date |
| `minuteStep` | `number` | `1` | Minute increment (e.g. `5` → 0, 5, 10…) |
| `format` | `string` | — | Output format (`YYYY`, `MM`, `DD`, `HH`, `mm`) |
| `locale` | `string` | `navigator.language` | BCP 47 locale for month names |
| `theme` | `"light" \| "dark"` | `"light"` | Colour theme |
| `primaryColor` | `string` | `"#007aff"` | Accent color (any CSS colour) |
| `itemHeight` | `number` | `44` | Row height in px |
| `visibleRows` | `number` | `5` | Number of visible rows (odd recommended) |
| `onChange` | `(date, formatted?) => void` | — | Fires on every column change |
| `onConfirm` | `(date, formatted?) => void` | — | Fires on "Done" button |
| `onCancel` | `() => void` | — | Fires on "Cancel" or Escape |

### Instance Methods

```ts
picker.show()                  // Show the picker
picker.hide()                  // Hide the picker
picker.toggle()                // Toggle visibility
picker.getValue()              // → Date (clone)
picker.getFormattedValue()     // → string | null
picker.setValue(date: Date)    // Programmatically set value
picker.setOptions(partial)     // Update theme, primaryColor at runtime
picker.destroy()               // Remove DOM + clean up listeners
```

---

## CSS Customisation

All visual properties are CSS custom properties. Override them on any ancestor element:

```css
/* In your own CSS */
:root {
  --mp-primary: #ff9500;         /* Accent / confirm button color */
  --mp-bg: #ffffff;              /* Picker background */
  --mp-text: #000000;            /* Item text color */
  --mp-item-height: 44px;        /* Height of each wheel row */
  --mp-visible-rows: 5;          /* Visible rows (as number) */
  --mp-font-family: 'Inter', sans-serif;
  --mp-border-radius: 16px;
  --mp-overlay: rgba(0,0,0,0.45);
  --mp-selection-bg: rgba(118,118,128,0.12); /* Selection band fill */
}
```

### Dark mode (manual)

```ts
picker.setOptions({ theme: 'dark' });
```

Or set `data-mp-theme="dark"` on the container.

---

## Format Tokens

| Token | Description | Example |
|-------|-------------|---------|
| `YYYY` | 4-digit year | `2024` |
| `MM` | 2-digit month | `03` |
| `DD` | 2-digit day | `07` |
| `HH` | 2-digit hour (24h) | `14` |
| `mm` | 2-digit minute | `30` |

**Example:**
```ts
format: 'YYYY-MM-DD HH:mm'  // → "2024-03-07 14:30"
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move focused column up/down |
| `Tab` | Move focus to next column |
| `Home` | Jump to first item |
| `End` | Jump to last item |
| `Escape` | Close picker (triggers `onCancel`) |

---

## Package Structure

```
momentum-picker/
├── src/
│   ├── types.ts          # All TypeScript interfaces
│   ├── utils.ts          # Pure date/format utilities
│   ├── WheelColumn.ts    # Single wheel column (momentum, snap, ARIA)
│   ├── MomentumPicker.ts # Orchestrator class
│   ├── styles.css        # iOS-style CSS with CSS variables
│   └── index.ts          # Public entry point
├── example/
│   ├── index.html        # Plain HTML demo (all modes + theme toggle)
│   ├── react-wrapper.tsx # React wrapper component
│   └── vue-wrapper.vue   # Vue 3 wrapper component
├── dist/                 # Built output (generated)
├── README.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Development

```bash
git clone https://github.com/your-org/momentum-picker
cd momentum-picker
npm install

# Start dev server with the example page
npm run dev

# Build library → dist/
npm run build

# Type-check only
npm run typecheck
```

---

## Publishing to npm

1. **Update version** in `package.json` (follow [semver](https://semver.org/)):
   ```bash
   npm version patch   # 0.1.0 → 0.1.1
   npm version minor   # 0.1.0 → 0.2.0
   npm version major   # 0.1.0 → 1.0.0
   ```

2. **Build** the package:
   ```bash
   npm run build
   ```

3. **Dry-run** to see what will be published:
   ```bash
   npm pack --dry-run
   ```

4. **Publish**:
   ```bash
   npm login             # if not already logged in
   npm publish           # public package
   # or for scoped:
   npm publish --access public
   ```

5. **Tag** the release in git:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome 80+ | ✅ |
| Firefox 75+ | ✅ |
| Safari 13.1+ | ✅ |
| Edge 80+ | ✅ |
| iOS Safari 13+ | ✅ |
| Android Chrome | ✅ |

---

## License

MIT © momentum-picker contributors
