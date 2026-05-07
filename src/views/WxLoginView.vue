<template>
  <div class="loading-page">
    <p>登录中...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'

const { wx_login } = useUser()
const router = useRouter()

onMounted(async () => {
  const { search } = window.location
  const params = new URLSearchParams(search)
  const code = params.get('code')
  if (code) {
    const ok = await wx_login(code)
    if (ok) {
      router.push('/')
      return
    }
  }
  router.push('/login')
})
</script>

<style scoped>
.loading-page {
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; color: #666;
}
</style>
