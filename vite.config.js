import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` matches the GitHub Pages URL: https://akrambgh1.github.io/kanban-board/
export default defineConfig({
  plugins: [react()],
  base: "/kanban-board/",
});
