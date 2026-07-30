import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sitio estático: el build de `dist/` se sube tal cual a Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: false },
})
