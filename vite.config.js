import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { localMenuApiPlugin } from "./scripts/local-menu-api.mjs";

export default defineConfig({
  plugins: [react(), localMenuApiPlugin()],
  server: {
    host: "127.0.0.1",
    watch: { ignored: ["**/.local/**"] }
  },
  preview: { host: "127.0.0.1" },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
        en: resolve(__dirname, "en.html"),
        it: resolve(__dirname, "it.html")
      }
    }
  }
});
