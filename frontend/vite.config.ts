import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true }, // must match the redirect URI registered in Okta
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap 5.3 still uses the Sass @import system; hide its deprecation noise.
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
})
