<template>
  <div class="page">
    <header class="page-header">
      <button class="btn btn-text" @click="goBack">← 返回</button>
      <h1>提示词模版</h1>
    </header>

    <div class="settings-card">
      <p class="desc">
        自定义 agent 提示词前缀。每轮对话自动追加此文本到 prompt 开头。
        Markdown 格式可用，适合放项目规范、工作流说明。
      </p>

      <div class="form-group">
        <label class="form-label">Prompt 前缀</label>
        <div class="prefix-preview" v-if="currentPrefix">
          <strong>当前生效：</strong>
          <pre class="preview-text">{{ currentPrefix }}</pre>
        </div>
        <textarea
          v-model="prefixText"
          rows="8"
          class="form-textarea mono"
          placeholder="不要进入plan mode，直接干活

（在此自定义每轮对话自动追加的提示词）"
        ></textarea>
        <div class="hint">留空恢复为默认值</div>
      </div>

      <div class="actions">
        <button class="btn btn-primary" @click="save" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <span v-if="saved" class="saved-tip">✓ 已保存</span>
        <span v-if="error" class="error-tip">{{ error }}</span>
      </div>
    </div>

    <div class="settings-card" style="margin-top:16px">
      <h2 style="font-size:16px;margin-bottom:12px">Memory 目录</h2>
      <p class="desc">
        Agent 读取 memory 文件的工作目录。每轮对话 agent 会先 cat 此目录下的 MEMORY.md 了解项目背景。
      </p>
      <div class="form-group">
        <label class="form-label">目录路径</label>
        <div class="prefix-preview">
          <strong>当前生效：</strong>
          <pre class="preview-text">{{ currentMemoryDir || '(未配置 — memory 指令将不会追加到 prompt 中)' }}</pre>
        </div>
        <input
          v-model="memoryDirText"
          class="form-input"
          placeholder="/Users/.../memory"
        />
        <div class="hint">留空恢复为默认值</div>
      </div>
      <div class="actions">
        <button class="btn btn-primary" @click="saveMemoryDir" :disabled="savingMemoryDir">
          {{ savingMemoryDir ? '保存中...' : '保存' }}
        </button>
        <span v-if="memoryDirSaved" class="saved-tip">✓ 已保存</span>
        <span v-if="memoryDirError" class="error-tip">{{ memoryDirError }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()

// Prompt prefix
const prefixText = ref('')
const currentPrefix = ref('')
const saving = ref(false)
const saved = ref(false)
const error = ref('')

// Memory dir
const memoryDirText = ref('')
const currentMemoryDir = ref('')
const savingMemoryDir = ref(false)
const memoryDirSaved = ref(false)
const memoryDirError = ref('')

async function fetchPrefix() {
  const { r, d } = await request({
    url: '/api/v2/upctl/api/config/prompt-prefix',
  })
  if (r && d) {
    currentPrefix.value = d.prefix || ''
    prefixText.value = d.prefix || ''
  }
}

async function fetchMemoryDir() {
  const { r, d } = await request({
    url: '/api/v2/upctl/api/config/memory-dir',
  })
  if (r && d) {
    currentMemoryDir.value = d.memory_dir || ''
    memoryDirText.value = d.memory_dir || ''
  }
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  const { r, d, e } = await request({
    url: '/api/v2/upctl/api/config/prompt-prefix',
    method: 'PUT',
    data: { prefix: prefixText.value },
  })
  saving.value = false
  if (r && d) {
    currentPrefix.value = d.prefix || ''
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } else {
    error.value = e || '保存失败'
  }
}

async function saveMemoryDir() {
  savingMemoryDir.value = true
  memoryDirSaved.value = false
  memoryDirError.value = ''
  const { r, d, e } = await request({
    url: '/api/v2/upctl/api/config/memory-dir',
    method: 'PUT',
    data: { memory_dir: memoryDirText.value },
  })
  savingMemoryDir.value = false
  if (r && d) {
    currentMemoryDir.value = d.memory_dir || ''
    memoryDirSaved.value = true
    setTimeout(() => { memoryDirSaved.value = false }, 3000)
  } else {
    memoryDirError.value = e || '保存失败'
  }
}

function goBack() {
  router.push('/')
}

onMounted(() => {
  fetchPrefix()
  fetchMemoryDir()
})
</script>

<style scoped>
.page { max-width: 700px; margin: 0 auto; padding: 0 16px 40px; min-height: 100vh; }
.page-header { display: flex; align-items: center; gap: 12px; padding: 16px 0; }
.page-header h1 { font-size: 20px; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 0; }
.settings-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.desc { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 20px; }
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
.form-textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; font-family: inherit; resize: vertical; }
.form-textarea:focus { border-color: #1a73e8; }
.form-textarea.mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 13px; }
.hint { font-size: 12px; color: #999; margin-top: 4px; }
.actions { display: flex; align-items: center; gap: 12px; }
.btn-primary { padding: 10px 24px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; background: #1a73e8; color: white; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.saved-tip { font-size: 14px; color: #2e7d32; }
.error-tip { font-size: 14px; color: #c62828; }
.prefix-preview { background: #f5f5f5; border-radius: 6px; padding: 10px; margin-bottom: 10px; font-size: 13px; }
.prefix-preview strong { display: block; margin-bottom: 4px; color: #666; }
.preview-text { margin: 0; white-space: pre-wrap; font-size: 12px; color: #333; line-height: 1.5; }
</style>
