import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages: aplikacja pod https://korzyb.github.io/housemenu/ (dev: w katalogu głównym)
  base: command === 'build' || isPreview ? '/housemenu/' : '/',
  // Dostęp z telefonu w tej samej sieci Wi-Fi: http://<IP komputera>:5173
  server: { host: true },
}))
