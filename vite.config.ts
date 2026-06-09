// Configuração nativa do TanStack Start com preset Vercel
// Substitui o @lovable.dev/vite-tanstack-config que era específico para Cloudflare
import { defineConfig } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    preset: "vercel",
  },
  vite: {
    plugins: [tsConfigPaths(), tailwindcss()],
  },
});
