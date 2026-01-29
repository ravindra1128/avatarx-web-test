import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  worker: {
    format: "es",
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".mjs"],
  },
  optimizeDeps: {
    include: ["shenai-sdk"],
    esbuildOptions: {
      loader: {
        ".mjs": "jsx",
        ".js": "jsx",
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom"
  },
});
