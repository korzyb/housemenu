import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Dostęp z telefonu w tej samej sieci Wi-Fi: http://<IP komputera>:5173
  server: { host: true },
})
