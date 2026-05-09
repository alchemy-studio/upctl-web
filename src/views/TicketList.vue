<template>
  <div class="ticket-list-page">
    <header class="page-header">
      <h1>工单列表</h1>
      <button class="btn btn-text" @click="logout">退出</button>
    </header>

    <div class="tab-bar">
      <button :class="['tab', { active: stateFilter === 'open' }]" @click="stateFilter = 'open'">待处理</button>
      <button :class="['tab', { active: stateFilter === 'closed' }]" @click="stateFilter = 'closed'">已关闭</button>
      <button :class="['tab', { active: stateFilter === 'all' }]" @click="stateFilter = 'all'">全部</button>
    </div>

    <div class="user-info" v-if="store.currentUser">
      👤 {{ store.currentUser.real_name }}
    </div>

    <div class="ticket-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="tickets.length === 0" class="empty">暂无工单</div>
      <div v-for="t in tickets" :key="t.number" class="ticket-card" @click="goDetail(t.number)">
        <div class="ticket-header">
          <span class="ticket-number">#{{ t.number }}</span>
          <span :class="['state-badge', t.state]">{{ t.state === 'open' ? '待处理' : '已关闭' }}</span>
        </div>
        <div class="ticket-title">{{ t.title }}</div>
        <div class="ticket-meta">
          <span>{{ t.user?.login || 'unknown' }}</span>
          <span>{{ formatTime(t.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import useUser from '@/store/user'
import request from '@/utils/request'
import type { Ticket } from '@/types'
import dayjs from 'dayjs'

const { store, logout } = useUser()
const router = useRouter()
const tickets = ref<Ticket[]>([])
const loading = ref(false)
const stateFilter = ref('open')

async function fetchTickets() {
  loading.value = true
  const { r, d, e } = await request({
    url: '/api/v2/upctl/api/tickets',
    params: { state: stateFilter.value, page: 1, page_size: 50 },
  })
  loading.value = false
  if (r && d) {
    tickets.value = d.tickets || d
  }
}

function goDetail(number: number) {
  router.push(`/tickets/${number}`)
}

function formatTime(t: string) {
  return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

watch(stateFilter, fetchTickets)
onMounted(() => { fetchTickets() })
</script>

<style scoped>
.ticket-list-page { max-width: 800px; margin: 0 auto; padding: 0 16px; }
.page-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; }
.tab-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.tab { padding: 8px 20px; border: 1px solid #ddd; border-radius: 20px; background: white; cursor: pointer; font-size: 14px; }
.tab.active { background: #1a73e8; color: white; border-color: #1a73e8; }
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
.ticket-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
</style>
