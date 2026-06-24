<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getRepositories, addRepository, updateRepository, deleteRepository, type Repository } from '@/services/repos-service'
import EmptyState from '@/components/shared/EmptyState.vue'

const route = useRoute()
const router = useRouter()

const repos = ref<Repository[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Tab state
type TabValue = 'all' | 'local' | 'github'
const activeTab = ref<TabValue>((route.query.tab as TabValue) || 'all')

// Sync ref update to URL query parameter
watch(activeTab, (newVal) => {
  router.replace({ query: { ...route.query, tab: newVal } })
})

// Sync URL query parameter changes back to ref (e.g. Back button)
watch(() => route.query.tab, (newVal) => {
  if (newVal && ['all', 'local', 'github'].includes(newVal as string)) {
    activeTab.value = newVal as TabValue
  } else {
    activeTab.value = 'all'
  }
})

// Modal states
const showModal = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const form = ref({
  key: '',
  relPath: '',
  isGitHub: false,
  buildCommand: '',
  lintCommand: '',
  testCommand: '',
})

async function loadRepos() {
  loading.value = true
  error.value = null
  try {
    repos.value = await getRepositories()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch repositories'
  } finally {
    loading.value = false
  }
}

const filteredRepos = computed(() => {
  if (activeTab.value === 'all') return repos.value
  if (activeTab.value === 'local') return repos.value.filter((r) => !r.isGitHub)
  if (activeTab.value === 'github') return repos.value.filter((r) => r.isGitHub)
  return repos.value
})

function openAddModal() {
  isEditing.value = false
  form.value = {
    key: '',
    relPath: '',
    isGitHub: false,
    buildCommand: '',
    lintCommand: '',
    testCommand: '',
  }
  formError.value = null
  showModal.value = true
}

function openEditModal(repo: Repository) {
  isEditing.value = true
  form.value = {
    key: repo.key,
    relPath: repo.relPath,
    isGitHub: !!repo.isGitHub,
    buildCommand: repo.buildCommand || '',
    lintCommand: repo.lintCommand || '',
    testCommand: repo.testCommand || '',
  }
  formError.value = null
  showModal.value = true
}

async function handleSubmit() {
  if (!form.value.key.trim() || !form.value.relPath.trim()) {
    formError.value = form.value.isGitHub ? 'Key and Repository (owner/repo) are required' : 'Key and Relative Path are required'
    return
  }

  if (form.value.isGitHub && !form.value.relPath.includes('/')) {
    formError.value = 'Repository path must be in "owner/repo" format'
    return
  }

  submitting.value = true
  formError.value = null

  try {
    const payload = {
      key: form.value.key.trim(),
      relPath: form.value.relPath.trim(),
      isGitHub: form.value.isGitHub,
      buildCommand: form.value.buildCommand.trim() || undefined,
      lintCommand: form.value.lintCommand.trim() || undefined,
      testCommand: form.value.testCommand.trim() || undefined,
    }

    if (isEditing.value) {
      await updateRepository(form.value.key, {
        relPath: payload.relPath,
        isGitHub: payload.isGitHub,
        buildCommand: payload.buildCommand,
        lintCommand: payload.lintCommand,
        testCommand: payload.testCommand,
      })
    } else {
      await addRepository(payload)
    }

    showModal.value = false
    await loadRepos()
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Operation failed'
  } finally {
    submitting.value = false
  }
}

async function handleDelete(repo: Repository) {
  if (!confirm(`Are you sure you want to delete repository "${repo.key}"?`)) {
    return
  }

  try {
    await deleteRepository(repo.key, repo.isGitHub)
    await loadRepos()
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to delete repository')
  }
}

onMounted(() => {
  loadRepos()
})
</script>

<template>
  <div class="p-4 sm:p-6 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Repositories</h1>
        <p class="text-xs text-slate-500 mt-0.5">Manage local and GitHub repositories registered in the agent workspace</p>
      </div>
      <button
        class="px-3.5 py-2 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-1.5"
        @click="openAddModal"
      >
        <Icon icon="lucide:plus" class="w-3.5 h-3.5 flex-shrink-0" />
        Register Repository
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6 flex justify-between items-center">
      <span>{{ error }}</span>
      <button class="text-red-500 hover:text-red-700 font-medium" @click="loadRepos">Retry</button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !repos.length" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
    </div>

    <!-- Filter tabs -->
    <div v-if="repos.length > 0" class="mb-4 flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit shadow-xs">
      <button
        v-for="tab in (['all', 'local', 'github'] as const)"
        :key="tab"
        :class="[
          'px-3 py-1.5 text-xs rounded-md transition-colors font-medium whitespace-nowrap',
          activeTab === tab
            ? 'bg-slate-800 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-700',
        ]"
        @click="activeTab = tab"
      >
        {{ tab === 'all' ? 'All' : tab === 'local' ? 'Local Only' : 'GitHub Only' }}
      </button>
    </div>

    <EmptyState
      v-if="!loading && filteredRepos.length === 0"
      icon="lucide:folder"
      :title="repos.length === 0 ? 'No repositories registered' : 'No repositories found'"
      :description="repos.length === 0 ? 'Register local folders or GitHub repositories so the coding agent can perform runs on them.' : 'No repositories match the current tab filter.'"
      :action-text="repos.length === 0 ? 'Register First Repo' : undefined"
      @action="openAddModal"
    />

    <!-- Repositories List -->
    <div v-else-if="filteredRepos.length > 0" class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider">
              <th class="px-5 py-3.5 font-medium">Key / Name</th>
              <th class="px-5 py-3.5 font-medium">Path / Repository</th>
              <th class="px-5 py-3.5 font-medium">Build/Lint/Test</th>
              <th class="px-5 py-3.5 font-medium">Status</th>
              <th class="px-5 py-3.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700">
            <tr v-for="repo in filteredRepos" :key="repo.key" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-5 py-4 font-medium text-slate-800">
                <div class="flex items-center gap-2">
                  <span>{{ repo.key }}</span>
                  <span
                    :class="[
                      'px-1.5 py-0.5 text-[9px] font-bold rounded-full',
                      repo.isGitHub
                        ? 'bg-violet-50 text-violet-700 border border-violet-100'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    ]"
                  >
                    {{ repo.isGitHub ? 'GitHub' : 'Local' }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 font-mono text-xs text-slate-600">
                {{ repo.relPath }}
              </td>
              <td class="px-5 py-4 space-y-1">
                <div v-if="repo.buildCommand" class="text-xs text-slate-500 flex items-center gap-1.5">
                  <span class="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">build</span>
                  <code class="font-mono text-[11px]">{{ repo.buildCommand }}</code>
                </div>
                <div v-if="repo.lintCommand" class="text-xs text-slate-500 flex items-center gap-1.5">
                  <span class="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">lint</span>
                  <code class="font-mono text-[11px]">{{ repo.lintCommand }}</code>
                </div>
                <div v-if="repo.testCommand" class="text-xs text-slate-500 flex items-center gap-1.5">
                  <span class="px-1 py-0.5 bg-slate-100 rounded text-[10px] font-mono">test</span>
                  <code class="font-mono text-[11px]">{{ repo.testCommand }}</code>
                </div>
                <span v-if="!repo.buildCommand && !repo.lintCommand && !repo.testCommand" class="text-slate-400 text-xs italic">none</span>
              </td>
              <td class="px-5 py-4">
                <span
                  v-if="repo.exists"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                >
                  <Icon icon="lucide:check-circle" class="w-3.5 h-3.5 text-green-500" /> Active
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                  :title="repo.isGitHub ? 'Not cloned locally in workspaces/github' : 'Directory not found under WORKSPACE_ROOT'"
                >
                  <Icon icon="lucide:alert-triangle" class="w-3.5 h-3.5 text-amber-500" /> {{ repo.isGitHub ? 'Not Cloned' : 'Path Not Found' }}
                </span>
              </td>
              <td class="px-5 py-4 text-right space-x-1.5">
                <button
                  class="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors inline-flex items-center gap-1.5"
                  @click="openEditModal(repo)"
                >
                  <Icon icon="lucide:pencil" class="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  class="px-2.5 py-1.5 text-xs border border-red-200 rounded-md hover:bg-red-50 text-red-600 transition-colors inline-flex items-center gap-1.5"
                  @click="handleDelete(repo)"
                >
                  <Icon icon="lucide:trash-2" class="w-3.5 h-3.5" /> Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form (Add / Edit) -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden transform transition-all">
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-slate-800">
            {{ isEditing ? 'Edit Repository' : 'Register New Repository' }}
          </h3>
          <button class="text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100" @click="showModal = false">
            <Icon icon="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Form -->
        <form @submit.prevent="handleSubmit" class="p-5 space-y-4">
          <div v-if="formError" class="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs">
            {{ formError }}
          </div>

          <!-- Repository Type Selection -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Repository Type</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  v-model="form.isGitHub"
                  :value="false"
                  :disabled="isEditing"
                  class="text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                Local Folder
              </label>
              <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  v-model="form.isGitHub"
                  :value="true"
                  :disabled="isEditing"
                  class="text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                GitHub Repository
              </label>
            </div>
          </div>

          <!-- Key / Name -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Key / Name <span class="text-red-500">*</span></label>
            <input
              v-model="form.key"
              type="text"
              placeholder="e.g. undangabi"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow disabled:bg-slate-50 disabled:text-slate-400 font-mono"
              required
              :disabled="isEditing"
            />
            <p v-if="!isEditing" class="text-[10px] text-slate-400 mt-1">Unique identifier. Alphanumeric, hyphens, and underscores only.</p>
          </div>

          <!-- Relative Path or GitHub Repository -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">
              {{ form.isGitHub ? 'GitHub Repository (owner/repo)' : 'Relative Path' }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.relPath"
              type="text"
              :placeholder="form.isGitHub ? 'e.g. ganjardbc/undangabi-v2' : 'e.g. undangabi-v2'"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
              required
            />
            <p class="text-[10px] text-slate-400 mt-1">
              {{ form.isGitHub ? 'The target repository on GitHub.' : 'Path relative to agent WORKSPACE_ROOT.' }}
            </p>
          </div>

          <!-- Build Command -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Build Command <span class="text-slate-400 font-normal">(optional)</span></label>
            <input
              v-model="form.buildCommand"
              type="text"
              placeholder="e.g. npm run build"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
            />
          </div>

          <!-- Lint Command -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Lint Command <span class="text-slate-400 font-normal">(optional)</span></label>
            <input
              v-model="form.lintCommand"
              type="text"
              placeholder="e.g. npm run lint"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
            />
          </div>

          <!-- Test Command -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Test Command <span class="text-slate-400 font-normal">(optional)</span></label>
            <input
              v-model="form.testCommand"
              type="text"
              placeholder="e.g. npm run test"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
            />
          </div>

          <!-- Modal Actions -->
          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              class="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 font-medium"
              @click="showModal = false"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="px-4 py-2 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm transition-colors disabled:bg-slate-300"
            >
              {{ submitting ? 'Saving...' : 'Save Config' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
