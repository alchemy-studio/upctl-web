<template>
  <div id="app-root">
    <div v-if="initializing" class="init-loading">加载中...</div>
    <router-view v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import useUser from '@/store/user'

console.debug('[upctl-web] deploy_ver=20260510.019')

// Block rendering until user roles are loaded so checkRole() works reliably
const initializing = ref(true)
const { read } = useUser()
onMounted(async () => {
  const token = window.localStorage.getItem('Authorization')
  if (token) {
    await read()
  }
  initializing.value = false
})
</script>

<style>
.init-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #999;
  font-size: 16px;
}
</style>

<style>
html, body, #app-root { min-height: 100vh; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
a { color: #1a73e8; text-decoration: none; }
</style>
