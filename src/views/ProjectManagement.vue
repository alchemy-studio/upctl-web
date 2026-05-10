<template>
  <div class="page">
    <header class="page-header">
      <button class="btn btn-text" @click="goBack">← 返回</button>
      <h1>项目管理</h1>
      <button class="btn btn-primary" @click="openCreate">新建项目</button>
    </header>

    <div v-if="store.loading" class="loading">加载中...</div>

    <div v-else-if="store.list.length === 0" class="empty">暂无项目，点击上方按钮新建</div>

    <div v-else class="project-list">
      <div v-for="p in store.list" :key="p.id" class="project-card">
        <div class="project-header">
          <span class="project-name">{{ p.name }}</span>
          <div class="project-actions">
            <button class="btn btn-sm" @click="openEdit(p)">编辑</button>
            <button class="btn btn-sm btn-danger" @click="confirmDelete(p)">删除</button>
          </div>
        </div>
        <div class="project-body">
          <div class="project-detail" v-if="p.repo_url">
            <label>仓库</label>
            <a :href="p.repo_url" target="_blank">{{ p.repo_url }}</a>
          </div>
          <div class="project-detail">
            <label>类型</label>
            <span :class="p.is_open_source ? 'badge-open' : 'badge-private'">{{ p.is_open_source ? '开源' : '私有' }}</span>
          </div>
          <div class="project-detail" v-if="p.memory_doc">
            <label>Memory</label>
            <div class="memory-preview">{{ p.memory_doc.slice(0, 200) }}{{ p.memory_doc.length > 200 ? '...' : '' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit modal -->
    <div v-if="showModal" class="dialog-overlay" @click.self="closeModal">
      <div class="dialog dialog-wide">
        <h3>{{ isEditing ? '编辑项目' : '新建项目' }}</h3>
        <div class="form-group">
          <label class="form-label">项目名称 *</label>
          <input v-model="form.name" class="form-input" placeholder="如 upctl-svc" />
        </div>
        <div class="form-group">
          <label class="form-label">仓库 URL</label>
          <input v-model="form.repo_url" class="form-input" placeholder="https://github.com/..." />
        </div>
        <div class="form-group">
          <label class="form-label">开源项目</label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_open_source" />
            是开源项目（prompt 时会附加密文泄漏警告）
          </label>
        </div>
        <div class="form-group">
          <label class="form-label">Memory 文档 (Markdown)</label>
          <textarea v-model="form.memory_doc" rows="6" class="form-textarea" placeholder="项目背景、架构说明等"></textarea>
        </div>
        <div class="dialog-actions">
          <button class="btn" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="submit" :disabled="!form.name.trim()">保存</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click.self="showDeleteConfirm = false">
      <div class="dialog">
        <h3>确认删除</h3>
        <p>确定删除项目「{{ deleteTarget?.name }}」？此操作不可撤销。</p>
        <div class="dialog-actions">
          <button class="btn" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" @click="doDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import useProject from '@/store/project'
import type { Project } from '@/types'

const router = useRouter()
const { store, fetchAll, create, update, remove } = useProject()
const showModal = ref(false)
const isEditing = ref(false)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<Project | null>(null)
const editingId = ref('')
const form = reactive({ name: '', repo_url: '', memory_doc: '', is_open_source: false })

function goBack() {
  router.push('/')
}

function openCreate() {
  isEditing.value = false
  editingId.value = ''
  form.name = ''
  form.repo_url = ''
  form.memory_doc = ''
  form.is_open_source = false
  showModal.value = true
}

function openEdit(p: Project) {
  isEditing.value = true
  editingId.value = p.id
  form.name = p.name
  form.repo_url = p.repo_url || ''
  form.memory_doc = p.memory_doc || ''
  form.is_open_source = p.is_open_source || false
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submit() {
  if (!form.name.trim()) return
  let ok: boolean
  if (isEditing.value) {
    ok = await update(editingId.value, {
      name: form.name.trim(),
      repo_url: form.repo_url.trim() || undefined,
      memory_doc: form.memory_doc.trim() || undefined,
      is_open_source: form.is_open_source,
    })
  } else {
    const result = await create({
      name: form.name.trim(),
      repo_url: form.repo_url.trim() || undefined,
      memory_doc: form.memory_doc.trim() || undefined,
      is_open_source: form.is_open_source,
    })
    ok = result.r
  }
  if (ok) closeModal()
}

function confirmDelete(p: Project) {
  deleteTarget.value = p
  showDeleteConfirm.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  await remove(deleteTarget.value.id)
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

onMounted(fetchAll)
</script>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 0 16px 40px; min-height: 100vh; background: transparent; }
.page-header { display: flex; align-items: center; gap: 12px; padding: 16px 0; }
.page-header h1 { font-size: 20px; flex: 1; }
.btn-text { background: none; border: none; color: #1a73e8; cursor: pointer; font-size: 14px; padding: 0; }
.project-list { display: flex; flex-direction: column; gap: 12px; padding-bottom: 24px; }
.loading, .empty { text-align: center; padding: 40px; color: #999; }
.project-card { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
.project-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.project-name { font-size: 16px; font-weight: 600; color: #333; }
.project-actions { display: flex; gap: 6px; }
.project-body { padding: 12px 16px; }
.project-detail { display: flex; gap: 8px; font-size: 13px; margin-bottom: 6px; }
.project-detail label { color: #999; min-width: 60px; flex-shrink: 0; }
.project-detail a { color: #1a73e8; word-break: break-all; }
.memory-preview { color: #555; white-space: pre-wrap; font-size: 12px; line-height: 1.5; background: #f9f9f9; padding: 8px; border-radius: 6px; max-height: 120px; overflow-y: auto; }
.btn { padding: 8px 16px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
.btn-sm { padding: 5px 12px; font-size: 12px; background: #f0f0f0; color: #333; }
.btn-primary { background: #1a73e8; color: white; }
.btn-danger { background: #fce4ec; color: #c62828; }
.badge-open { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 12px; background: #e8f5e9; color: #2e7d32; font-weight: 500; }
.badge-private { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 12px; background: #f3e5f5; color: #7b1fa2; font-weight: 500; }
.dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 100; }
.dialog { background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 500px; }
.dialog-wide { max-width: 600px; }
.dialog h3 { font-size: 16px; margin-bottom: 16px; }
.dialog p { font-size: 14px; color: #666; margin-bottom: 16px; }
.form-group { margin-bottom: 14px; }
.form-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
.form-input, .form-textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none; font-family: inherit; }
.form-input:focus, .form-textarea:focus { border-color: #1a73e8; }
.form-textarea { resize: vertical; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
</style>
