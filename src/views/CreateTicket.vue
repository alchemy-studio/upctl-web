<template>
  <div class="create-page">
    <header class="page-header">
      <button class="btn btn-text" @click="goBack">← 返回</button>
      <h1>新建工单</h1>
    </header>

    <div class="form-card">
      <div class="form-group">
        <label class="form-label">标题</label>
        <input v-model="title" placeholder="请输入工单标题" class="form-input" maxlength="200" />
      </div>
      <div class="form-group">
        <label class="form-label">关联项目</label>
        <div v-if="projectStore.loading" class="text-muted">加载中...</div>
        <div v-else class="project-checkboxes">
          <label v-for="p in projectStore.list" :key="p.id" class="checkbox-label">
            <input type="checkbox" :value="p.id" v-model="selectedProjectIds" />
            {{ p.name }}
          </label>
          <div v-if="projectStore.list.length === 0" class="text-muted">暂无可选项目</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">内容</label>
        <div class="upload-area">
          <button class="upload-btn" type="button" @click="triggerUpload">📎 上传图片</button>
          <input ref="fileInputRef" type="file" accept="image/*" hidden @change="uploadImage" />
        </div>
        <textarea v-model="body" rows="12" placeholder="请输入工单内容（支持 Markdown 格式）" class="form-textarea" @input="autoResize"></textarea>
        <div v-if="uploading" class="uploading">上传中...</div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" @click="goBack">取消</button>
        <button class="btn btn-primary" @click="submit" :disabled="!canSubmit || submitting">
          {{ submitting ? '提交中...' : '提交' }}
        </button>
      </div>
      <p v-if="error" class="error-msg">{{ error }}</p>
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
const title = ref('')
const body = ref('')
const submitting = ref(false)
const uploading = ref(false)
const error = ref('')
const selectedProjectIds = ref<string[]>([])

const canSubmit = computed(() => title.value.trim() && body.value.trim())

async function submit() {
  if (!canSubmit.value || submitting.value) return
  error.value = ''
  submitting.value = true

  // Append selected projects to body as markdown
  let finalBody = body.value.trim()
  if (selectedProjectIds.value.length > 0) {
    const selected = projectStore.store.list.filter(p => selectedProjectIds.value.includes(p.id))
    const projectsMd = selected.map(p => `- **${p.name}**${p.repo_url ? ` (${p.repo_url})` : ''}`).join('\n')
    finalBody += `\n\n## 关联项目\n${projectsMd}`
    if (selected.some(p => p.memory_doc)) {
      finalBody += '\n\n### 项目 Memory\n'
      for (const p of selected) {
        if (p.memory_doc) {
          finalBody += `\n#### ${p.name}\n${p.memory_doc}\n`
        }
      }
    }
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

onMounted(() => {
  projectStore.fetchAll()
})
</script>

<style scoped>
.create-page { max-width: 800px; margin: 0 auto; padding: 0 16px; }
.page-header { display: flex; align-items: center; gap: 12px; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 0; }
.form-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
.form-input { width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; outline: none; font-family: inherit; }
.form-input:focus { border-color: #1a73e8; }
.form-textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; resize: vertical; font-family: inherit; outline: none; }
.form-textarea:focus { border-color: #1a73e8; }
.project-checkboxes { display: flex; gap: 12px; flex-wrap: wrap; padding: 8px 0; }
.checkbox-label { display: flex; align-items: center; gap: 4px; font-size: 14px; cursor: pointer; }
.text-muted { color: #999; font-size: 13px; }
.upload-area { margin-bottom: 8px; }
.upload-btn { display: inline-block; padding: 6px 14px; background: #f0f0f0; border-radius: 6px; font-size: 13px; cursor: pointer; color: #666; }
.uploading { font-size: 13px; color: #1a73e8; margin: 4px 0; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-primary { background: #1a73e8; color: white; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-secondary { background: #f0f0f0; color: #666; }
.error-msg { color: #e74c3c; margin-top: 12px; font-size: 14px; text-align: center; }
</style>
