# Momentum Picker Demo

A simple demo application showcasing the momentum-picker library.

## Setup

The dependencies have already been installed. momentum-picker is included in `package.json`.

## Running the Demo

### Development Mode
```bash
npm run dev
```

This will start a local development server. Open your browser to the provided URL (typically `http://localhost:5173`).

### Build for Production
```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

### Preview Production Build
```bash
npm run preview
```

## What's Included

- **index.html** - HTML structure with styled container
- **app.js** - Main application file using MomentumPicker
- **package.json** - npm configuration with momentum-picker dependency

## Features Demonstrated

- DateTime picker mode
- Custom confirmation handler
- Styled UI with gradient background
- Display of selected date/time

## Customization

Edit `app.js` to change picker options:

```javascript
const wheel = new MomentumPicker({
  container: '#app',
  mode: 'datetime', // or 'date', 'time', 'range', 'multiple'
  // ... other options
});
```

For more information, visit the [momentum-picker documentation](https://www.npmjs.com/package/momentum-picker).
