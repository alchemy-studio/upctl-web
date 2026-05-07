import { reactive } from 'vue'
import request from '@/utils/request'
import { saveToken, clearTokens, HtySudoToken } from '@/utils/index'
import type { HtyUser, HtyRole } from '@/types'

interface UserState {
  currentUser: HtyUser | null
  currentRole?: string
  roles: HtyRole[]
  loading: boolean
}

const store = reactive<UserState>({
  currentUser: null,
  roles: [],
  loading: false,
})

export default function useUser() {
  async function wx_login(code: string) {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/wx_qr_login',
      method: 'POST',
      data: { code },
    })
    store.loading = false
    if (r && d) {
      saveToken(d)
      await sudo()
      return true
    }
    return false
  }

  async function login(unionid: string) {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/login2_with_unionid',
      headers: { Unionid: unionid },
    })
    store.loading = false
    if (r && d) {
      saveToken(d)
      await sudo()
      return true
    }
    return false
  }

  async function sudo() {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/sudo',
      method: 'POST',
    })
    store.loading = false
    if (r && d) {
      window.localStorage.setItem(HtySudoToken, d)
      return await read()
    }
    return false
  }

  async function read() {
    store.loading = true
    const { r, d, e } = await request({
      url: '/api/v1/uc/find_user_with_info_by_token',
    })
    store.loading = false
    if (r && d) {
      store.currentUser = d as HtyUser
      const userApp = d.infos?.[0]
      if (userApp?.roles) {
        store.roles = userApp.roles
      }
      return true
    }
    return false
  }

  function checkRole(roleKey: string): boolean {
    return store.roles.some((r) => r.role_key === roleKey)
  }

  function logout() {
    store.currentUser = null
    store.roles = []
    clearTokens()
    window.location.href = '/login'
  }

  return { store, wx_login, login, sudo, read, checkRole, logout }
}
