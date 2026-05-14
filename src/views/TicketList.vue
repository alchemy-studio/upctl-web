<template>
  <div class="max-w-2xl mx-auto px-4 pb-10 min-h-screen">
    <div class="flex gap-2 mb-3">
      <button
        :class="[
          'border border-border rounded-full px-5 py-2 text-sm cursor-pointer',
          stateFilter === 'open' ? 'bg-primary text-white' : 'bg-white text-text'
        ]"
        @click="stateFilter = 'open'"
      >待处理</button>
      <button
        :class="[
          'border border-border rounded-full px-5 py-2 text-sm cursor-pointer',
          stateFilter === 'closed' ? 'bg-primary text-white' : 'bg-white text-text'
        ]"
        @click="stateFilter = 'closed'"
      >已关闭</button>
      <button
        :class="[
          'border border-border rounded-full px-5 py-2 text-sm cursor-pointer',
          stateFilter === 'all' ? 'bg-primary text-white' : 'bg-white text-text'
        ]"
        @click="stateFilter = 'all'"
      >全部</button>
    </div>

    <div class="mb-2">
      <input
        v-model="searchQuery"
        class="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary"
        placeholder="搜索工单标题或内容..."
        @input="onSearchInput"
      />
    </div>
    <div class="mb-2">
      <label class="flex items-center gap-1 text-xs text-text-muted cursor-pointer">
        <input type="checkbox" v-model="hideE2E" @change="fetchTickets" />
        隐藏 E2E 测试工单
      </label>
    </div>
    <div v-if="store.currentUser" class="text-text-muted text-sm py-2">
      👤 {{ store.currentUser.real_name }}
    </div>

    <div class="flex flex-col gap-2 pb-5">
      <div v-if="loading && tickets.length === 0" class="text-center py-10 text-text-muted">加载中...</div>
      <div v-else-if="tickets.length === 0" class="text-center py-10 text-text-muted">暂无工单</div>
      <div
        v-for="t in tickets"
        :key="t.number"
        class="bg-surface rounded-xl shadow-sm p-3.5 cursor-pointer hover:shadow-md"
        @click="goDetail(t.number)"
      >
        <div class="flex justify-between items-center mb-1.5">
          <span class="text-primary font-semibold text-xs">#{{ t.number }}</span>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-xs',
              t.state === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            ]"
          >{{ t.state === 'open' ? '待处理' : '已关闭' }}</span>
        </div>
        <div class="text-sm mb-1.5 leading-snug">{{ t.title }}</div>
        <div v-if="t.labels?.length" class="flex gap-1 flex-wrap mb-1.5">
          <span
            v-for="l in t.labels"
            :key="l.id"
            class="inline-block px-1 py-0.5 rounded text-xs font-medium text-white"
            :style="{ background: '#' + l.color }"
          >{{ l.name }}</span>
        </div>
        <div class="flex justify-between text-xs text-text-muted">
          <span>{{ t.user?.login || 'unknown' }}</span>
          <span>{{ formatTime(t.created_at) }}</span>
        </div>
      </div>
    </div>
    <div v-if="hasMore" class="text-center py-5">
      <button
        class="bg-primary text-white rounded-lg px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'
import request from '@/utils/request'
import type { Ticket } from '@/types'
import dayjs from 'dayjs'

const { store, logout } = useUser()
const router = useRouter()
const tickets = ref<Ticket[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalCount = ref(0)
const hasMore = computed(() => {
  const visible = tickets.value.length
  if (totalCount.value <= 0) return false
  if (visible >= totalCount.value) return false
  return visible >= PAGE_SIZE || totalCount.value > PAGE_SIZE
})
const PAGE_SIZE = 50
const stateFilter = ref('open')
const searchQuery = ref('')
const hideE2E = ref(localStorage.getItem('hideE2E') === 'true')
watch(hideE2E, (v) => localStorage.setItem('hideE2E', v ? 'true' : 'false'))
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function fetchTickets(reset = true) {
  if (reset) {
    currentPage.value = 1
    tickets.value = []
  }
  loading.value = true
  const params: Record<string, any> = { state: stateFilter.value, page: currentPage.value, page_size: PAGE_SIZE }
  if (searchQuery.value.trim()) {
    params.q = searchQuery.value.trim()
  }
  if (hideE2E.value) {
    params.hide_e2e = 'true'
  }
  const { r, d, e } = await request({
    url: '/api/v2/upctl/api/tickets',
    params,
  })
  loading.value = false
  if (r && d) {
    tickets.value = [...tickets.value, ...(d.tickets || d)]
    if (d.total_count) totalCount.value = d.total_count
  }
}

function loadMore() {
  currentPage.value++
  fetchTickets(false)
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchTickets()
  }, 300)
}

function goDetail(number: number) {
  router.push(`/tickets/${number}`)
}

function goCreate() {
  router.push('/tickets/new')
}

function formatTime(t: string) {
  return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

watch(stateFilter, fetchTickets)
onMounted(() => { fetchTickets() })
</script>
