<template>
  <div class="ticket-list-page">
    <header class="page-header">
      <h1>工单列表</h1>
      <div class="header-actions">
        <router-link to="/projects" class="btn btn-text">项目管理</router-link>
        <router-link to="/settings/prompt-prefix" class="btn btn-text">提示词模版</router-link>
        <button class="btn btn-text" @click="goCreate">新建工单</button>
        <button class="btn btn-text" @click="logout">退出</button>
      </div>
    </header>

    <div class="tab-bar">
      <button :class="['tab', { active: stateFilter === 'open' }]" @click="stateFilter = 'open'">待处理</button>
      <button :class="['tab', { active: stateFilter === 'closed' }]" @click="stateFilter = 'closed'">已关闭</button>
      <button :class="['tab', { active: stateFilter === 'all' }]" @click="stateFilter = 'all'">全部</button>
    </div>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        class="search-input"
        placeholder="搜索工单标题或内容..."
        @input="onSearchInput"
      />
    </div>
    <div class="filter-row">
      <label class="filter-e2e">
        <input type="checkbox" v-model="hideE2E" @change="fetchTickets" />
        隐藏 E2E 测试工单
      </label>
    </div>
    <div class="user-info" v-if="store.currentUser">
      👤 {{ store.currentUser.real_name }}
    </div>

    <div class="ticket-list">
      <div v-if="loading && tickets.length === 0" class="loading">加载中...</div>
      <div v-else-if="tickets.length === 0" class="empty">暂无工单</div>
      <div v-for="t in tickets" :key="t.number" class="ticket-card" @click="goDetail(t.number)">
        <div class="ticket-header">
          <span class="ticket-number">#{{ t.number }}</span>
          <span :class="['state-badge', t.state]">{{ t.state === 'open' ? '待处理' : '已关闭' }}</span>
        </div>
        <div class="ticket-title">{{ t.title }}</div>
        <div class="ticket-labels" v-if="t.labels?.length">
          <span v-for="l in t.labels" :key="l.id" class="ticket-label" :style="{ background: '#' + l.color }">{{ l.name }}</span>
        </div>
        <div class="ticket-meta">
          <span>{{ t.user?.login || 'unknown' }}</span>
          <span>{{ formatTime(t.created_at) }}</span>
        </div>
      </div>
    </div>
    <div v-if="hasMore" class="load-more-wrap">
      <button class="btn btn-outline" @click="loadMore" :disabled="loading">
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
  // When hideE2E is active, totalCount from API may include filtered E2E tickets.
  // The visible tickets already exclude E2E (server-side filter).
  // If totalCount <= PAGE_SIZE, all tickets fit on one page regardless of filtering.
  // Only show "load more" when there clearly are more pages of data.
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

<style scoped>
.ticket-list-page { max-width: 800px; margin: 0 auto; padding: 0 16px 40px; min-height: 100vh; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab { padding: 8px 20px; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; font-size: 14px; }
.tab.active { background: #1a73e8; color: white; border-color: #1a73e8; }
.search-bar { margin-bottom: 8px; }
.search-input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; box-sizing: border-box; }
.search-input:focus { border-color: #1a73e8; }
.filter-row { margin-bottom: 8px; }
.filter-e2e { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #666; cursor: pointer; }
.user-info { padding: 8px 0; color: #666; font-size: 14px; }
.ticket-list { display: flex; flex-direction: column; gap: 8px; padding-bottom: 20px; }
.ticket-card { background: white; border-radius: 10px; padding: 14px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.08); transition: box-shadow 0.2s; }
.ticket-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
.ticket-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.ticket-number { color: #1a73e8; font-weight: 600; font-size: 13px; }
.state-badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; }
.state-badge.open { background: #e8f5e9; color: #2e7d32; }
.state-badge.closed { background: #f5f5f5; color: #999; }
.ticket-title { font-size: 15px; margin-bottom: 6px; line-height: 1.4; }
.ticket-labels { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.ticket-label { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; color: #fff; font-weight: 500; }
.ticket-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
.load-more-wrap { text-align: center; padding: 20px; }
.btn-outline { padding: 8px 32px; border: 1px solid #ddd; border-radius: 8px; background: white; cursor: pointer; font-size: 14px; color: #666; }
.btn-outline:hover { background: #f5f5f5; border-color: #bbb; }
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
