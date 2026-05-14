<template>
  <div class="max-w-[800px] mx-auto px-4 pb-10 min-h-screen">
    <!-- Toolbar: inline back button + primary new-project button -->
    <div class="flex items-center justify-between py-4">
      <button class="text-[#1a73e8] bg-transparent border-none cursor-pointer text-sm p-0" @click="goBack">← 返回</button>
      <button class="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#667eea] hover:bg-[#5a67d8] text-white" @click="openCreate">新建项目</button>
    </div>

    <div v-if="store.loading" class="text-center py-10 text-[#999]">加载中...</div>

    <div v-else-if="store.list.length === 0" class="text-center py-10 text-[#999]">暂无项目，点击上方按钮新建</div>

    <div v-else class="flex flex-col gap-3 pb-6">
      <div v-for="p in store.list" :key="p.id" class="bg-surface rounded-xl shadow-sm overflow-hidden project-card">
        <div class="flex justify-between items-center px-4 py-3.5 bg-gray-50 border-b border-border">
          <span class="text-base font-semibold text-[#333]">{{ p.name }}</span>
          <div class="flex gap-1.5 items-center">
            <span v-if="p.is_archived" class="inline-block px-2 py-0.5 rounded-full text-xs bg-[#f5f5f5] text-[#999] font-medium mr-1.5">已归档</span>
            <button class="px-3 py-1.5 text-xs rounded-md bg-[#f0f0f0] text-[#333] cursor-pointer" @click="openEdit(p)">编辑</button>
            <button v-if="!p.is_archived" class="px-3 py-1.5 text-xs rounded-md bg-[#fff3e0] text-[#e65100] cursor-pointer hover:bg-[#ffe0b2]" @click="archiveProject(p)">归档</button>
            <button v-if="p.is_archived" class="px-3 py-1.5 text-xs rounded-md bg-[#e8f5e9] text-[#2e7d32] cursor-pointer" @click="unarchiveProject(p)">恢复</button>
            <button class="px-3 py-1.5 text-xs rounded-md bg-[#fce4ec] text-[#c62828] cursor-pointer" @click="confirmDelete(p)">删除</button>
          </div>
        </div>
        <div class="px-4 py-3">
          <div v-if="p.repo_url" class="flex gap-2 text-sm mb-1.5">
            <label class="text-[#999] min-w-[60px] shrink-0">仓库</label>
            <a :href="p.repo_url" target="_blank" class="text-[#1a73e8] break-all">{{ p.repo_url }}</a>
          </div>
          <div class="flex gap-2 text-sm mb-1.5">
            <label class="text-[#999] min-w-[60px] shrink-0">类型</label>
            <span :class="p.is_open_source ? 'inline-block px-2 py-0.5 rounded-full text-xs bg-[#e8f5e9] text-[#2e7d32] font-medium' : 'inline-block px-2 py-0.5 rounded-full text-xs bg-[#f3e5f5] text-[#7b1fa2] font-medium'">{{ p.is_open_source ? '开源' : '私有' }}</span>
          </div>
          <div v-if="p.memory_doc" class="flex gap-2 text-sm mb-1.5">
            <label class="text-[#999] min-w-[60px] shrink-0">Memory</label>
            <div class="text-[#555] whitespace-pre-wrap text-xs leading-relaxed bg-[#f9f9f9] p-2 rounded-md max-h-[120px] overflow-y-auto">{{ p.memory_doc.slice(0, 200) }}{{ p.memory_doc.length > 200 ? '...' : '' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-surface rounded-xl p-6 w-11/12 max-w-lg">
        <h3 class="text-base mb-4">{{ isEditing ? '编辑项目' : '新建项目' }}</h3>
        <div class="mb-3.5">
          <label class="block text-sm font-semibold text-[#333] mb-1">项目名称 *</label>
          <input v-model="form.name" class="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-primary font-sans" placeholder="如 upctl-svc" />
        </div>
        <div class="mb-3.5">
          <label class="block text-sm font-semibold text-[#333] mb-1">仓库 URL</label>
          <input v-model="form.repo_url" class="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-primary font-sans" placeholder="https://github.com/..." />
        </div>
        <div class="mb-3.5">
          <label class="block text-sm font-semibold text-[#333] mb-1">开源项目</label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.is_open_source" class="w-4 h-4" />
            <span class="text-sm text-[#333]">是开源项目（prompt 时会附加密文泄漏警告）</span>
          </label>
        </div>
        <div class="mb-3.5">
          <label class="block text-sm font-semibold text-[#333] mb-1">Memory 文档 (Markdown)</label>
          <textarea v-model="form.memory_doc" rows="6" class="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:border-primary font-sans resize-y" placeholder="项目背景、架构说明等"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#f0f0f0] text-[#333]" @click="closeModal">取消</button>
          <button class="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#667eea] hover:bg-[#5a67d8] text-white disabled:opacity-50 disabled:cursor-not-allowed" @click="submit" :disabled="!form.name.trim()">保存</button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
      <div class="bg-surface rounded-xl p-6 w-11/12 max-w-lg">
        <h3 class="text-base mb-4">确认删除</h3>
        <p class="text-sm text-[#666] mb-4">确定删除项目「{{ deleteTarget?.name }}」？此操作不可撤销。</p>
        <div class="flex justify-end gap-2 mt-4">
          <button class="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#f0f0f0] text-[#333]" @click="showDeleteConfirm = false">取消</button>
          <button class="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#fce4ec] text-[#c62828]" @click="doDelete">删除</button>
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

async function archiveProject(p: Project) {
  await update(p.id, { is_archived: true })
}

async function unarchiveProject(p: Project) {
  await update(p.id, { is_archived: false })
}

onMounted(fetchAll)
</script>
