import { reactive, computed } from 'vue'
import request from '@/utils/request'
import type { Project } from '@/types'

interface ProjectState {
  list: Project[]
  loading: boolean
}

const store = reactive<ProjectState>({
  list: [],
  loading: false,
})

export default function useProject() {
  const activeList = computed(() => store.list.filter(p => !p.is_archived))

  async function fetchAll() {
    store.loading = true
    const { r, d } = await request({
      url: '/api/v2/upctl/api/projects',
    })
    store.loading = false
    if (r && Array.isArray(d)) {
      store.list = d
    } else {
      store.list = []
    }
  }

  async function create(data: { name: string; repo_url?: string; memory_doc?: string; is_open_source?: boolean; is_archived?: boolean }) {
    const { r, d } = await request({
      url: '/api/v2/upctl/api/projects',
      method: 'POST',
      data,
    })
    if (r) await fetchAll()
    return { r, d }
  }

  async function update(id: string, data: { name?: string; repo_url?: string; memory_doc?: string; is_open_source?: boolean; is_archived?: boolean }) {
    const { r, d } = await request({
      url: `/api/v2/upctl/api/projects/${id}`,
      method: 'PATCH',
      data,
    })
    if (r && d) {
      // In-place update to avoid full list re-render and scroll jump
      const idx = store.list.findIndex(p => p.id === id)
      if (idx >= 0) store.list[idx] = d
    }
    return r
  }

  async function remove(id: string) {
    const { r } = await request({
      url: `/api/v2/upctl/api/projects/${id}`,
      method: 'DELETE',
    })
    if (r) await fetchAll()
    return r
  }

  return { store, activeList, fetchAll, create, update, remove }
}
