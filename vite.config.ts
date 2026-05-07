import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const Environments: Record<string, any> = {
  local: {
    main: 'http://admin.localhost:8088',
    ts: 'http://ts.localhost:8088',
    host: 'ticket.localhost:8088',
    wx_app: '',
  },
  moicen: {
    main: 'https://admin.moicen.com',
    ts: 'https://ts.moicen.com',
    host: 'ticket.moicen.com',
    wx_app: 'wx4c6a0a85d5fc6107',
  },
}

const mode = (process.env.mode || 'local') as keyof typeof Environments
const config = Environments[mode]

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
    },
  },
})
