import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: "canonical-site-shell-paths",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        // Shared site chrome is owned by the website root, not the app base.
        return html.replace(/(["'])\/learning\/(css\/site-shell\.css|js\/site-shell\.js)(["'])/g, "$1/$2$3");
      },
    },
  }],
});
