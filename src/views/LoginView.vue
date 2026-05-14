<template>
  <div
    class="flex items-center justify-center h-screen"
    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  >
    <div class="bg-surface rounded-2xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] text-center w-[400px]">
      <h1 class="text-2xl mb-2 text-text">工单管理系统</h1>
      <p class="text-text-muted mb-6">请使用微信扫码登录</p>
      <div v-if="showWxQr" id="login-qr" class="flex justify-center my-5"></div>
      <div v-else class="flex flex-col gap-3">
        <p class="text-gray-400 text-sm">开发模式：请输入 union_id</p>
        <input
          v-model="unionid"
          placeholder="union_id"
          class="px-4 py-2.5 border border-border rounded-lg text-sm"
        />
        <button
          @click="submit"
          :disabled="!unionid.trim()"
          class="px-6 py-2.5 rounded-lg text-sm cursor-pointer bg-primary text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          登录
        </button>
      </div>
      <p v-if="error" class="text-danger mt-3 text-sm">{{ error }}</p>
      <button
        v-if="hasToken"
        class="mt-6 text-xs text-text-muted hover:text-primary bg-transparent border-0 cursor-pointer underline"
        @click="logout">退出登录 / 切换账号</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { store, wx_login, login, logout } = useUser()
const router = useRouter()
const unionid = ref('')
const error = ref('')
const showWxQr = ref(false)
const hasToken = ref(!!window.localStorage.getItem('Authorization'))

onMounted(() => {
  if (WX_APP) {
    showWxQr.value = true
    nextTick(() => initWxQr())
  }
})

function initWxQr() {
  const container = document.getElementById('login-qr')
  if (!container) return
  const iframe = document.createElement('iframe')
  const redirectUri = `https://${WX_REDIRECT_HOST}/ticket-wx-login`
  const url = 'https://open.weixin.qq.com/connect/qrconnect?' +
    `appid=${WX_APP}&scope=snsapi_login&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${Math.random().toString(36).replace('.', '')}&login_type=jssdk&self_redirect=false` +
    '&style=white'
  iframe.src = url
  iframe.width = '300px'
  iframe.height = '400px'
  iframe.style.border = 'none'
  container.innerHTML = ''
  container.appendChild(iframe)
}

async function submit() {
  error.value = ''
  const ok = await login(unionid.value)
  if (ok) {
    router.push('/')
  } else {
    error.value = '登录失败'
  }
}
</script>
