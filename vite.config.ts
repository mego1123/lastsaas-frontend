import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
  base: process.env.VITE_BASE_PATH,
  server: {
    port: 5173,
    proxy: {
      // Proxy /api requests to the lastsaas Go backend
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
