import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  root: "demo",
  resolve: {
    alias: {
      mirion: resolve(import.meta.dirname, "src/index.ts"),
    },
  },
  server: {
    port: 3000,
  },
});
