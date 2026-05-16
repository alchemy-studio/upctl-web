import { reactive } from 'vue'
import request from '@/utils/request'
import type { DeployEnv } from '@/types'

interface DeployEnvState {
  list: DeployEnv[]
  loading: boolean
}

const store = reactive<DeployEnvState>({
  list: [],
  loading: false,
})

export default function useDeployEnv() {
  async function fetchAll() {
    store.loading = true
    const { r, d } = await request({
      url: '/api/v2/upctl/api/deploy_envs',
    })
    store.loading = false
    if (r && Array.isArray(d)) {
      store.list = d
    } else {
      store.list = []
    }
  }

  return { store, fetchAll }
}
