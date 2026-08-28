import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this repo at https://<username>.github.io/balancepoint/
  // so every asset URL needs this prefix, or you'll get blank-page 404s.
  base: '/balancepoint/',
  plugins: [react()],
  server: {
    // Opens automatically when you run `npm run dev`.
    // Which actual browser opens is controlled by the BROWSER env var (see README).
    open: true,
  },
})
