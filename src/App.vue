<template>
  <div id="app-root">
    <div v-if="initializing" class="init-loading">加载中...</div>
    <template v-else>
      <!-- 导航栏：仅在非登录页显示 -->
      <header v-if="isLoggedIn && !isLoginRoute" class="bg-white border-b border-border px-4">
        <div class="max-w-6xl mx-auto h-14 flex items-center justify-between">
          <div class="flex items-center gap-1">
            <router-link to="/" class="font-semibold text-text mr-4 text-sm">工单管理</router-link>
            <router-link to="/" class="nav-link">工单列表</router-link>
            <router-link to="/tickets/new" class="nav-link">新建工单</router-link>
            <router-link to="/projects" class="nav-link">项目管理</router-link>
            <router-link to="/settings/prompt-prefix" class="nav-link">设置</router-link>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="text-text-muted">{{ username }}</span>
            <button class="text-primary hover:text-primary-dark text-sm cursor-pointer bg-transparent border-0" @click="handleLogout">退出</button>
          </div>
        </div>
      </header>
      <router-view />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useUser from '@/store/user'

console.debug('[upctl-web] deploy_ver=20260513.001')

const initializing = ref(true)
const route = useRoute()
const router = useRouter()
const { store, read, logout } = useUser()

const isLoggedIn = computed(() => !!store.currentUser?.hty_id)
const username = computed(() => store.currentUser?.real_name || '')
const isLoginRoute = computed(() => {
  const name = route.name
  return name === 'login' || name === 'wx-login'
})

function handleLogout() {
  logout()
}

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
.nav-link {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #666;
  text-decoration: none;
  transition: background 0.15s;
}
.nav-link:hover { background: #f0f0f0; }
.nav-link.active { background: #667eea; color: white; }
</style>
