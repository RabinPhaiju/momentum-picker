import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      outDir: "dist/types",
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      // Entry point of the library
      entry: resolve(__dirname, "src/index.ts"),
      name: "MomentumPicker",
      // Generates both ESM and UMD/CJS bundles
      formats: ["es", "umd"],
      fileName: (format) =>
        format === "es" ? "momentum-picker.es.js" : "momentum-picker.umd.js",
    },
    rollupOptions: {
      // Do NOT bundle any external dependencies (there are none, but good practice)
      external: [],
      output: {
        // Global variable name for UMD/IIFE builds consumed via <script>
        globals: {},
        // Inline CSS into the JS bundle so consumers don't need a separate import
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "style.css";
          return assetInfo.name ?? "asset";
        },
      },
    },
    // Generate sourcemaps for easier debugging of the published package
    sourcemap: true,
    // Clean dist before each build
    emptyOutDir: true,
  },
});
