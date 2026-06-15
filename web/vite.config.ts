import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tmpdir } from "node:os";
import { join } from "node:path";

const apiPort = process.env.API_PORT ?? "8000";
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  // Dropbox locks node_modules/.vite on Windows — cache outside sync folder.
  cacheDir: join(tmpdir(), "cmaps-vite-cache"),
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
