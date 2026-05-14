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
            <strong>{{ commentAuthor(c) }}</strong>
            <span class="comment-time">{{ formatTime(c.created_at) }}</span>
          </div>
          <div class="comment-body" v-html="renderCommentBody(c.body)"></div>
        </div>
      </div>

      <div v-if="ticket.state === 'open'" class="reply-section">
        <div class="reply-actions-bar" v-if="canManage">
          <button v-if="!hasLabel('approved')" class="btn btn-approve" @click="approveTicket" :disabled="approving">
            {{ approving ? '批准中...' : '✓ 批准工单' }}
          </button>
          <button v-if="!hasLabel('in_progress')" class="btn btn-pin" @click="startProgress" :disabled="pinning">
            {{ pinning ? '处理中...' : '📌 开始处理' }}
          </button>
          <button v-if="hasLabel('approved') && !hasLabel('in_progress')" class="btn btn-unapprove" @click="unapproveTicket" :disabled="unapproving">
            {{ unapproving ? '取消中...' : '↩ 解除批准' }}
          </button>
          <button class="btn btn-close" @click="closeTicket" :disabled="closing">
            {{ closing ? '关闭中...' : '✕ 关闭工单' }}
          </button>
        </div>
        <div v-if="!isLocked">
          <h3>添加评论</h3>
          <div class="upload-area">
            <button class="upload-btn" type="button" @click="triggerUpload">📎 上传附件</button>
            <input ref="fileInputRef" type="file" accept="image/*,.pdf,.doc,.docx,.txt" hidden @change="uploadImage" />
          </div>
          <textarea v-model="commentText" rows="6" placeholder="输入评论内容..." class="comment-input"></textarea>
          <div v-if="uploading" class="uploading">上传中...</div>
          <div class="reply-actions">
            <button @click="sendComment" :disabled="sending" class="btn btn-primary">
              {{ sending ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>
        <div v-else class="lock-hint">该工单已锁定（已批准或处理中），无法添加评论</div>
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

const { store, checkRole } = useUser()
const route = useRoute()
const router = useRouter()
const ticket = ref<Ticket | null>(null)
const comments = ref<TicketComment[]>([])
const loading = ref(false)
const commentText = ref('')
const sending = ref(false)
const uploading = ref(false)
const approving = ref(false)
const pinning = ref(false)
const unapproving = ref(false)
const closing = ref(false)

const canManage = computed(() => checkRole('ADMIN') || checkRole('TESTER'))

function hasLabel(name: string) {
  return ticket.value?.labels?.some((l: any) => l.name === name) ?? false
}

const renderedBody = computed(() => renderMarkdown(ticket.value?.body || ''))
const isLocked = computed(() => {
  const labels = ticket.value?.labels || []
  return labels.some((l: any) => ['approved', 'in_progress'].includes(l.name))
})
const ticketNumber = Number(route.params.number)

async function fetchDetail() {
  loading.value = true
  const { r, d, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}`,
  })
  loading.value = false
  if (r && d) {
    const detail = d as TicketDetail
    ticket.value = detail.issue
    comments.value = detail.comments || []
  }
}

async function sendComment() {
  if (sending.value) return
  sending.value = true
  const { r, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}/comments`,
    method: 'POST',
    data: {
      body: commentText.value,
      submitter_name: store.currentUser?.real_name || undefined,
    },
  })
  sending.value = false
  if (r) {
    commentText.value = ''
    await fetchDetail()
  }
}

async function approveTicket() {
  approving.value = true
  const { r, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}`,
    method: 'PATCH',
    data: { labels: ['approved'] },
  })
  approving.value = false
  if (r) await fetchDetail()
}

async function unapproveTicket() {
  unapproving.value = true
  const { r, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}`,
    method: 'PATCH',
    data: { unlabels: ['approved'] },
  })
  unapproving.value = false
  if (r) await fetchDetail()
}

async function startProgress() {
  pinning.value = true
  // Start processing implies approval: add approved + in_progress labels
  const { r, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}`,
    method: 'PATCH',
    data: { labels: ['approved', 'in_progress'] },
  })
  if (!r) {
    pinning.value = false
    return
  }
  await fetchDetail()
  // Then trigger the agent to start working on this ticket
  // The backend builds ticket context + memory instruction + prompt prefix
  const prompt = '## 当前工单\n开始处理此工单。'
  // Fire-and-forget: use short wait_secs to avoid browser timeout (nginx 499).
  // The agent receives the prompt regardless of whether we wait for a response.
  const { r: agentOk } = await request({
    url: '/api/v2/upctl/api/agent/prompt',
    method: 'POST',
    data: {
      prompt,
      ticket_number: ticketNumber,
      wait_secs: 1,
    },
  })
  pinning.value = false
  if (agentOk) {
    // Add a comment to confirm agent was triggered
    await request({
      url: `/api/v2/upctl/api/tickets/${ticketNumber}/comments`,
      method: 'POST',
      data: { body: '🤖 已通知 agent 开始处理此工单。' },
    })
    await fetchDetail()
  }
}

async function closeTicket() {
  if (!confirm('确认关闭此工单？关闭后无法恢复。')) return
  closing.value = true
  const { r, e } = await request({
    url: `/api/v2/upctl/api/tickets/${ticketNumber}`,
    method: 'PATCH',
    data: { state: 'closed' },
  })
  closing.value = false
  if (r) await fetchDetail()
}

const fileInputRef = ref<HTMLInputElement | null>(null)
function triggerUpload() {
  fileInputRef.value?.click()
}

async function uploadImage(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  const { r, d, e: err } = await request({
    url: '/api/v2/upctl/api/upload_attachment',
    method: 'POST',
    data: file,
    headers: { 'Content-Type': file.type },
  })
  uploading.value = false
  if (r && d?.url) {
    const isImage = file.type.startsWith('image/')
    if (isImage) {
      commentText.value += `\n![${file.name}](${d.url})\n`
    } else {
      commentText.value += `\n[${file.name}](${d.url})\n`
    }
  }
}

function commentAuthor(c: TicketComment): string {
  const body = c.body || ''
  // Check if body starts with "> Name" (submitter_name prefix from backend)
  const match = body.match(/^>\s*([^\n]+)\n/)
  if (match) {
    return match[1].trim()
  }
  return c.user?.login || 'unknown'
}

function renderCommentBody(body: string) {
  // Remove the submitter_name prefix line if present
  const cleaned = body.replace(/^>\s*[^\n]*\n(\n)?/, '')
  return renderMarkdown(cleaned)
}

function renderMarkdown(text: string): string {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
  // file attachments (uploaded via /api/v2/upctl/api/attachment/...)
  html = html.replace(
    /\[([^\]]+)\]\(\/api\/v2\/upctl\/api\/attachment\/([^)]+)\)/g,
    (match: string, text: string, urlSuffix: string) => {
      const ext = urlSuffix.split('.').pop()?.toLowerCase() || ''
      const isPdf = ext === 'pdf'
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
      const fullUrl = `/api/v2/upctl/api/attachment/${urlSuffix}`
      if (isImage) {
        return `<img src="${fullUrl}" alt="${text}" class="md-img" />`
      }
      const icon = isPdf ? '📄' : '📎'
      const openHtml = isPdf
        ? `<a href="${fullUrl}" target="_blank" class="file-open-btn" title="在新标签页打开">打开</a>`
        : `<a href="${fullUrl}" target="_blank" class="file-open-btn" download title="下载文件">下载</a>`
      return `<div class="file-attachment"><span class="file-icon">${icon}</span><span class="file-name">${text}</span>${openHtml}</div>`
    }
  )
  // regular links (non-attachment)
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
.detail-page { max-width: 800px; margin: 0 auto; padding: 0 16px 40px; min-height: 100vh; }
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
.reply-actions-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.btn-approve { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; background: #2e7d32; color: white; }
.btn-approve:disabled { background: #a5d6a7; cursor: not-allowed; }
.btn-pin { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; background: #e65100; color: white; }
.btn-pin:disabled { background: #ffcc80; cursor: not-allowed; }
.btn-unapprove { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; background: #f9a825; color: white; }
.btn-unapprove:disabled { background: #fff9c4; cursor: not-allowed; }
.btn-close { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; background: #c62828; color: white; }
.btn-close:disabled { background: #ef9a9a; cursor: not-allowed; }
.lock-hint { text-align: center; color: #999; font-size: 13px; margin-top: 8px; }
.upload-area { margin-bottom: 8px; }
.upload-btn { display: inline-block; padding: 6px 14px; background: #f0f0f0; border-radius: 6px; font-size: 13px; cursor: pointer; color: #666; }
.comment-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; }
.reply-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
.btn-primary { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; background: #1a73e8; color: white; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 0; }
.file-attachment { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f8f9ff; border: 1px solid #e0e3f0; border-radius: 8px; margin: 8px 0; }
.file-icon { font-size: 20px; flex-shrink: 0; }
.file-name { flex: 1; font-size: 13px; color: #333; word-break: break-all; }
.file-open-btn { padding: 4px 12px; border-radius: 6px; font-size: 12px; background: #1a73e8; color: white; text-decoration: none; flex-shrink: 0; }
.file-open-btn:hover { background: #1557b0; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
.uploading { font-size: 13px; color: #1a73e8; margin: 4px 0; }
</style>
