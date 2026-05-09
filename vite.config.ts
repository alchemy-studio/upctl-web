import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const config = {
  main: process.env.VITE_UC_SERVER !== undefined ? process.env.VITE_UC_SERVER : 'http://admin.localhost:8088',
  ts: process.env.VITE_TS_SERVER !== undefined ? process.env.VITE_TS_SERVER : 'http://ts.localhost:8088',
  host: process.env.VITE_HOST || 'ticket.localhost:8088',
  wx_app: process.env.VITE_WX_APP || '',
}

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    HOST: JSON.stringify(config.host),
    UC_SERVER: JSON.stringify(config.main),
    TS_SERVER: JSON.stringify(config.ts),
    WX_APP: JSON.stringify(config.wx_app),
  },
  server: {
    port: 8010,
    proxy: {
      '/api/v1/uc': { changeOrigin: true, target: config.main },
      '/api/v2/ts': { changeOrigin: true, target: config.ts },
      '/api/v2/upctl/api': { changeOrigin: true, target: config.main },
    },
  },
})
