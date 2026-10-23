import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/mcp": "http://127.0.0.1:3100",
      "/private": "http://127.0.0.1:3100",
      "/health": "http://127.0.0.1:3100"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
