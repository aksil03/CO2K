import path from "path"
import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {},
    "process.versions": { node: "22.6.0", modules: "120" },
    "process": { env: {}, versions: { node: "22.6.0", modules: "120" } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ".prisma/client/index-browser": path.resolve(__dirname, "./node_modules/.prisma/client/index-browser.js"),
    },
  },
})
