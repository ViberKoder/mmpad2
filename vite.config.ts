import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
  },
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api/tonfun': {
        target: 'https://api.ton.fun',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tonfun/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Удаляем host заголовок
            proxyReq.removeHeader('host');
          });
        },
      },
    },
  },
})
