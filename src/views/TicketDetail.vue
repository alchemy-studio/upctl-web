<template>
  <div class="detail-page">
    <header class="detail-header">
      <button class="btn btn-text" @click="goBack">← 返回</button>
      <h1 v-if="ticket">#{{ ticket.number }}</h1>
    </header>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-if="ticket">
      <div class="ticket-section">
        <h2 class="ticket-title">{{ ticket.title }}</h2>
        <div class="ticket-meta">
          <span>状态: <strong :class="ticket.state">{{ ticket.state === 'open' ? '待处理' : '已关闭' }}</strong></span>
          <span>创建者: {{ ticket.user?.login }}</span>
          <span>{{ formatTime(ticket.created_at) }}</span>
        </div>
        <div class="ticket-body" v-html="renderedBody"></div>
        <div v-if="ticket.labels && ticket.labels.length" class="labels">
          <span v-for="l in ticket.labels" :key="l.id" class="label" :style="{ background: '#' + l.color + '22', color: '#' + l.color }">{{ l.name }}</span>
        </div>
      </div>

      <div class="comments-section">
        <h3>评论 ({{ comments.length }})</h3>
        <div v-if="comments.length === 0" class="empty">暂无评论</div>
        <div v-for="c in comments" :key="c.id" class="comment-card">
          <div class="comment-header">
            <strong>{{ c.user.login }}</strong>
            <span class="comment-time">{{ formatTime(c.created_at) }}</span>
          </div>
          <div class="comment-body" v-html="renderCommentBody(c.body)"></div>
        </div>
      </div>

      <div v-if="ticket.state === 'open'" class="reply-section">
        <h3>添加评论</h3>
        <div class="upload-area">
          <label class="upload-btn">
            📎 上传图片
            <input type="file" accept="image/*" hidden @change="uploadImage" />
          </label>
        </div>
        <textarea v-model="commentText" rows="4" placeholder="输入评论内容..." class="comment-input"></textarea>
        <div v-if="uploading" class="uploading">上传中...</div>
        <div class="reply-actions">
          <button @click="sendComment" :disabled="!commentText.trim() || sending" class="btn btn-primary">
            {{ sending ? '发送中...' : '发送' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/utils/request'
import type { Ticket, TicketComment, TicketDetail } from '@/types'
import dayjs from 'dayjs'
import useUser from '@/store/user'

const { store } = useUser()
const route = useRoute()
const router = useRouter()
const ticket = ref<Ticket | null>(null)
const comments = ref<TicketComment[]>([])
const loading = ref(false)
const commentText = ref('')
const sending = ref(false)
const uploading = ref(false)

const renderedBody = computed(() => renderMarkdown(ticket.value?.body || ''))
const ticketNumber = Number(route.params.number)

async function fetchDetail() {
  loading.value = true
  const { r, d, e } = await request({
    url: `/api/v2/ts/tickets/${ticketNumber}`,
  })
  loading.value = false
  if (r && d) {
    const detail = d as TicketDetail
    ticket.value = detail.issue
    comments.value = detail.comments || []
  }
}

async function sendComment() {
  if (!commentText.value.trim() || sending.value) return
  sending.value = true
  const { r, e } = await request({
    url: `/api/v2/ts/tickets/${ticketNumber}/comments`,
    method: 'POST',
    data: { body: commentText.value },
  })
  sending.value = false
  if (r) {
    commentText.value = ''
    await fetchDetail()
  }
}

async function uploadImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  const { r, d, e: err } = await request({
    url: '/api/v2/ts/upload_attachment',
    method: 'POST',
    data: file,
    headers: { 'Content-Type': file.type },
  })
  uploading.value = false
  if (r && d?.url) {
    commentText.value += `\n![image](${d.url})\n`
  }
}

function renderCommentBody(body: string) {
  return renderMarkdown(body)
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
  // line breaks
  html = html.replace(/\n/g, '<br/>')
  // bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  return html
}

function formatTime(t: string) {
  return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

function goBack() {
  router.push('/')
}

onMounted(fetchDetail)
</script>

<style scoped>
.detail-page { max-width: 800px; margin: 0 auto; padding: 0 16px 100px; }
.detail-header { display: flex; align-items: center; gap: 12px; padding: 16px 0; }
.detail-header h1 { font-size: 18px; color: #1a73e8; }
.ticket-section { background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.ticket-title { font-size: 18px; margin-bottom: 12px; }
.ticket-meta { display: flex; gap: 16px; font-size: 13px; color: #666; margin-bottom: 16px; flex-wrap: wrap; }
.ticket-meta .open { color: #2e7d32; }
.ticket-meta .closed { color: #999; }
.ticket-body { font-size: 14px; line-height: 1.7; color: #444; }
.ticket-body :deep(.md-img) { max-width: 100%; border-radius: 8px; margin: 8px 0; }
.labels { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.label { padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.comments-section { background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.comments-section h3 { font-size: 16px; margin-bottom: 16px; }
.comment-card { padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.comment-card:last-child { border-bottom: none; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
.comment-time { color: #999; }
.comment-body { font-size: 14px; line-height: 1.6; color: #444; }
.comment-body :deep(.md-img) { max-width: 100%; border-radius: 8px; margin: 8px 0; max-height: 300px; object-fit: contain; }
.reply-section { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.reply-section h3 { font-size: 16px; margin-bottom: 12px; }
.upload-area { margin-bottom: 8px; }
.upload-btn { display: inline-block; padding: 6px 14px; background: #f0f0f0; border-radius: 6px; font-size: 13px; cursor: pointer; color: #666; }
.comment-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; }
.reply-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-primary { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; background: #1a73e8; color: white; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 0; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
.uploading { font-size: 13px; color: #1a73e8; margin: 4px 0; }
</style>
