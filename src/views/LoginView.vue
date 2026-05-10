<template>
  <div class="login-container">
    <div class="login-header">
      <h1>工单管理系统</h1>
      <p>请使用微信扫码登录</p>
    </div>
    <div v-if="showWxQr" id="login-qr" class="qr-wrapper"></div>
    <div v-else class="unionid-form">
      <p class="dev-hint">开发模式：请输入 union_id</p>
      <input v-model="unionid" placeholder="union_id" class="form-input" />
      <button @click="submit" :disabled="!unionid.trim()" class="btn btn-primary">登录</button>
    </div>
    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { wx_login, login } = useUser()
const router = useRouter()
const unionid = ref('')
const error = ref('')
const showWxQr = ref(false)

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

<style scoped>
.login-container {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 100vh; background: #fff;
}
.login-header { text-align: center; margin-bottom: 32px; }
.login-header h1 { font-size: 22px; color: #333; margin-bottom: 8px; font-weight: 600; }
.login-header p { font-size: 14px; color: #999; }
.qr-wrapper { display: flex; justify-content: center; }
.unionid-form { display: flex; flex-direction: column; gap: 12px; width: 300px; }
.dev-hint { color: #999; font-size: 13px; text-align: center; }
.form-input { padding: 10px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
.btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-primary { background: #1a73e8; color: white; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.error-msg { color: #e74c3c; margin-top: 12px; font-size: 14px; text-align: center; }
</style>
