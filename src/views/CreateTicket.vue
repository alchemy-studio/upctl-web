<template>
  <div class="max-w-2xl mx-auto px-4 pb-10 min-h-screen">
    <button class="text-primary bg-transparent border-none cursor-pointer text-sm p-0 mb-3 inline-block hover:underline" @click="goBack">← 返回</button>

    <div class="bg-surface rounded-xl shadow-sm p-5">
      <div class="mb-4">
        <label class="block text-sm font-semibold text-text mb-2">标题</label>
        <input v-model="title" placeholder="请输入工单标题" class="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm outline-none focus:border-primary font-sans" maxlength="200" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-semibold text-text mb-2">关联项目</label>
        <div v-if="projectStore.store.loading" class="text-text-muted text-xs">加载中...</div>
        <div v-else class="flex gap-3 flex-wrap py-2">
          <label v-for="p in activeList" :key="p.id" class="flex items-center gap-1 text-sm cursor-pointer">
            <input type="checkbox" :value="p.id" v-model="selectedProjectIds" />
            {{ p.name }}
          </label>
          <div v-if="projectStore.store.list.length === 0" class="text-text-muted text-xs">暂无可选项目</div>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-semibold text-text mb-2">内容</label>
        <div class="mb-2">
          <button class="inline-block px-3.5 py-1.5 bg-gray-100 rounded-lg text-xs cursor-pointer text-text-muted" type="button" @click="triggerUpload">📎 上传图片</button>
          <input ref="fileInputRef" type="file" accept="image/*" hidden @change="uploadImage" />
        </div>
        <textarea v-model="body" rows="12" placeholder="请输入工单内容（支持 Markdown 格式）" class="w-full px-3 py-3 border border-border rounded-lg text-sm resize-y font-sans outline-none focus:border-primary" @input="autoResize"></textarea>
        <div v-if="uploading" class="text-xs text-primary mt-1">上传中...</div>
      </div>
      <div class="flex justify-end gap-2 mt-5">
        <button class="bg-gray-100 text-text-muted rounded-lg px-6 py-2.5 text-sm" @click="goBack">取消</button>
        <button class="bg-primary text-white rounded-lg px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed" @click="submit" :disabled="!canSubmit || submitting">
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
      <p v-if="error" class="text-danger mt-3 text-sm text-center">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import useProject from '@/store/project'

const router = useRouter()
const projectStore = useProject()
const activeList = projectStore.activeList

const title = ref('')
const body = ref('')
const submitting = ref(false)
const uploading = ref(false)
const error = ref('')
const selectedProjectIds = ref<string[]>([])

const canSubmit = computed(() => title.value.trim().length > 0)

async function submit() {
  if (!canSubmit.value || submitting.value) return
  error.value = ''
  submitting.value = true

  // Append selected projects to body as markdown references (no memory_doc or repo_url)
  // The backend build_ticket_context will assemble the full prompt text including memory_doc
  let finalBody = body.value.trim()
  if (selectedProjectIds.value.length > 0) {
    const selected = projectStore.store.list.filter(p => selectedProjectIds.value.includes(p.id))
    const projectsMd = selected.map(p => `- **${p.name}**`).join('\n')
    finalBody += `\n\n## 关联项目\n${projectsMd}`
  }

  const { r, d, e } = await request({
    url: '/api/v2/upctl/api/tickets',
    method: 'POST',
    data: { title: title.value.trim(), body: finalBody },
  })
  submitting.value = false
  if (r && d?.number) {
    router.push(`/tickets/${d.number}`)
  } else {
    error.value = e || '提交失败'
  }
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
    body.value += `\n![image](${d.url})\n`
  }
}

function goBack() {
  router.push('/')
}

function autoResize(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}

onMounted(async () => {
  await projectStore.fetchAll()
  console.debug('[CreateTicket] projects loaded:', projectStore.store.list.length, 'items')
  if (projectStore.store.list.length > 0) {
    console.debug('[CreateTicket] first project:', JSON.stringify({
      id: projectStore.store.list[0].id,
      name: projectStore.store.list[0].name,
    }))
  }
})
</script>
