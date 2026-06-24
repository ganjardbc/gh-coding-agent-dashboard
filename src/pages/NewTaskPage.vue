<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useRunTask } from '@/composables/useRunTask'
import { getRepos } from '@/services/health-service'
import type { GitHubJobContext } from '@/types/github'
import type { Repository } from '@/services/repos-service'

const router = useRouter()
const route = useRoute()
const { submitting, result, error, submitTask, reset } = useRunTask()

import { computed, watch } from 'vue'

const repos = ref<Repository[]>([])
const isGitHubMode = ref(false)
const fullRepo = ref('')
const selectedGithubRepoKey = ref('custom')
const showAdvanced = ref(false)

const form = ref({
  repo: '',
  task: '',
  validate: false,
})

const github = ref<{
  owner: string
  repo: string
  branch: string
  baseBranch: string
  issueNumber: string
  prNumber: string
}>({
  owner: '',
  repo: '',
  branch: '',
  baseBranch: '',
  issueNumber: '',
  prNumber: '',
})

const localRepos = computed(() => repos.value.filter((r) => !r.isGitHub))
const githubRepos = computed(() => repos.value.filter((r) => r.isGitHub))

// Automatically update fullRepo when selecting a registered GitHub repo
watch(selectedGithubRepoKey, (key) => {
  if (key !== 'custom') {
    const found = repos.value.find((r) => r.key === key)
    if (found) {
      fullRepo.value = found.relPath
    }
  } else {
    fullRepo.value = ''
  }
})

async function loadRepos() {
  try {
    repos.value = await getRepos()
    
    // Select first local repo by default
    const firstLocal = repos.value.find((r) => !r.isGitHub)
    if (firstLocal && !form.value.repo) {
      form.value.repo = firstLocal.key
    }

    // Try to match query parameters to a registered repository
    if (route.query.ghOwner && route.query.ghRepo) {
      const matchPath = `${route.query.ghOwner}/${route.query.ghRepo}`
      const match = repos.value.find((r) => r.isGitHub && r.relPath === matchPath)
      if (match) {
        selectedGithubRepoKey.value = match.key
        fullRepo.value = match.relPath
      } else {
        selectedGithubRepoKey.value = 'custom'
        fullRepo.value = matchPath
      }
    }
  } catch {
    repos.value = [
      { key: 'undangabi', relPath: 'undangabi', isGitHub: false, exists: false },
      { key: 'coderium', relPath: 'coderium', isGitHub: false, exists: false },
      { key: 'umkm-pos', relPath: 'umkm-pos', isGitHub: false, exists: false },
    ]
    if (!form.value.repo) form.value.repo = repos.value[0].key
  }
}

onMounted(async () => {
  await loadRepos()
  if (route.query.repo) form.value.repo = String(route.query.repo)
  if (route.query.task) form.value.task = String(route.query.task)
  if (route.query.validate) form.value.validate = route.query.validate === 'true'
  // GitHub replay params
  if (route.query.ghOwner) {
    isGitHubMode.value = true
    github.value.branch = String(route.query.ghBranch ?? '')
    github.value.baseBranch = String(route.query.ghBaseBranch ?? '')
    github.value.issueNumber = String(route.query.ghIssueNumber ?? '')
    github.value.prNumber = String(route.query.ghPrNumber ?? '')
    if (github.value.baseBranch || github.value.issueNumber || github.value.prNumber) {
      showAdvanced.value = true
    }
  }
})

function buildGitHubContext(): GitHubJobContext | undefined {
  if (!isGitHubMode.value) return undefined
  const parts = fullRepo.value.split('/')
  const owner = parts[0]?.trim()
  const repo = parts[1]?.trim()
  if (!owner || !repo || !github.value.branch.trim()) return undefined
  return {
    owner,
    repo,
    branch: github.value.branch.trim(),
    baseBranch: github.value.baseBranch.trim() || undefined,
    issueNumber: github.value.issueNumber ? Number(github.value.issueNumber) : undefined,
    prNumber: github.value.prNumber ? Number(github.value.prNumber) : undefined,
  }
}

async function handleSubmit() {
  if (isGitHubMode.value) {
    const parts = fullRepo.value.split('/')
    if (parts.length < 2 || !parts[0].trim() || !parts[1].trim() || !github.value.branch.trim()) {
      return
    }
  } else {
    if (!form.value.repo) return
  }
  if (!form.value.task.trim()) return

  const ghCtx = buildGitHubContext()
  const repoParam = isGitHubMode.value
    ? (selectedGithubRepoKey.value === 'custom' ? '' : selectedGithubRepoKey.value)
    : form.value.repo
  const r = await submitTask(repoParam, form.value.task.trim(), form.value.validate, ghCtx)
  if (r) {
    setTimeout(() => {
      router.push(`/jobs/${r.runId}`)
    }, 1500)
  }
}

function startOver() {
  reset()
  form.value.task = ''
  isGitHubMode.value = false
  fullRepo.value = ''
  selectedGithubRepoKey.value = 'custom'
  showAdvanced.value = false
  github.value = { owner: '', repo: '', branch: '', baseBranch: '', issueNumber: '', prNumber: '' }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-slate-800">New Task</h1>
      <p class="text-xs text-slate-500 mt-0.5">Submit a new agent task to the queue</p>
    </div>

    <!-- Success state -->
    <div v-if="result" class="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3 shadow-sm">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:check-circle" class="text-green-600 w-5 h-5 flex-shrink-0" />
        <span class="font-medium text-green-800">Task submitted successfully</span>
      </div>
      <dl class="space-y-1 text-sm">
        <div class="flex gap-2">
          <dt class="text-green-600 w-20">Run ID</dt>
          <dd class="font-mono text-green-800">{{ result.runId }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-green-600 w-20">Job ID</dt>
          <dd class="font-mono text-green-800">{{ result.jobId }}</dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-green-600 w-20">Status</dt>
          <dd class="font-mono text-green-800">{{ result.status }}</dd>
        </div>
      </dl>
      <div class="flex gap-2 pt-1">
        <button
          class="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors shadow-sm"
          @click="router.push(`/jobs/${result.runId}`)"
        >
          View Job →
        </button>
        <button
          class="px-3 py-1.5 text-xs bg-white border border-green-200 hover:bg-green-50 text-green-700 rounded transition-colors"
          @click="startOver"
        >
          New Task
        </button>
      </div>
    </div>

    <!-- Form -->
    <form v-else class="space-y-4" @submit.prevent="handleSubmit">
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <!-- Mode Tabs -->
        <div class="flex border-b border-slate-100 bg-slate-50/50 p-1">
          <button
            type="button"
            class="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            :class="!isGitHubMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="isGitHubMode = false"
          >
            Local Registry
          </button>
          <button
            type="button"
            class="flex-1 py-2 text-xs font-medium rounded-lg transition-all"
            :class="isGitHubMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            @click="isGitHubMode = true"
          >
            GitHub Repository
          </button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Mode Description -->
          <div v-if="!isGitHubMode" class="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 flex gap-2">
            <Icon icon="lucide:info" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <span class="font-semibold text-slate-700">Local Registry:</span> Menjalankan tugas pada direktori lokal yang terdaftar pada workspace server. Agen akan membaca dan menulis perubahan kode langsung ke repositori lokal tersebut di server.
            </div>
          </div>
          <div v-else class="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-600 flex gap-2">
            <Icon icon="lucide:info" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <span class="font-semibold text-slate-700">GitHub Repository:</span> Menjalankan tugas secara remote dengan mengkloning repositori dari GitHub. Agen akan mengambil kode dari branch asal, memproses tugas, membuat branch baru, dan mengirimkan feedback via commit/Pull Request ke GitHub.
            </div>
          </div>

          <!-- Local Repo Selection -->
          <div v-if="!isGitHubMode">
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Select Repository</label>
            <select
              v-model="form.repo"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
              required
            >
              <option v-for="repo in localRepos" :key="repo.key" :value="repo.key">{{ repo.key }}</option>
            </select>
          </div>

          <!-- GitHub Context Form -->
          <div v-else class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1.5">GitHub Repository</label>
                <select
                  v-model="selectedGithubRepoKey"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
                >
                  <option value="custom">Custom Repo...</option>
                  <option v-for="repo in githubRepos" :key="repo.key" :value="repo.key">{{ repo.key }} ({{ repo.relPath }})</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1.5">Branch <span class="text-red-500">*</span></label>
                <input
                  v-model="github.branch"
                  type="text"
                  placeholder="e.g. main or feature/branch"
                  class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                  required
                />
              </div>
            </div>

            <!-- Custom Repo Owner/Name Text Input (only shown when selectedGithubRepoKey is 'custom') -->
            <div v-if="selectedGithubRepoKey === 'custom'">
              <label class="block text-xs font-medium text-slate-700 mb-1.5">Custom Repository (owner/repo) <span class="text-red-500">*</span></label>
              <input
                v-model="fullRepo"
                type="text"
                placeholder="e.g. owner/repo"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                required
              />
            </div>

            <!-- Advanced Options Toggle -->
            <div>
              <button
                type="button"
                class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 focus:outline-none"
                @click="showAdvanced = !showAdvanced"
              >
                <span>{{ showAdvanced ? 'Hide' : 'Show' }} Advanced Settings (Issue, PR, Base Branch)</span>
                <Icon :icon="showAdvanced ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            </div>

            <!-- Advanced fields -->
            <div v-if="showAdvanced" class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Base Branch</label>
                <input
                  v-model="github.baseBranch"
                  type="text"
                  placeholder="e.g. main"
                  class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Issue #</label>
                <input
                  v-model="github.issueNumber"
                  type="number"
                  min="1"
                  placeholder="e.g. 12"
                  class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">PR #</label>
                <input
                  v-model="github.prNumber"
                  type="number"
                  min="1"
                  placeholder="e.g. 34"
                  class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Task Description -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Task Instructions</label>
            <textarea
              v-model="form.task"
              rows="6"
              placeholder="Describe what you want the agent to do..."
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow resize-y font-mono"
              required
            />
          </div>

          <!-- Mode / Validation Checkbox -->
          <div class="pt-2">
            <label class="flex items-center gap-2.5 cursor-pointer">
              <input
                v-model="form.validate"
                type="checkbox"
                class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-slate-700">Run with validation (build / lint / test)</span>
            </label>
            <p class="text-xs text-slate-400 mt-1 ml-6">
              Enables automatic verification steps in the execution phase.
            </p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
        {{ error }}
      </div>

      <!-- Form Actions -->
      <div class="flex items-center gap-2 justify-end">
        <button
          type="button"
          class="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          @click="form.task = ''"
        >
          Clear
        </button>
        <button
          type="submit"
          :disabled="submitting || (!isGitHubMode && !form.repo) || !form.task.trim() || (isGitHubMode && (!fullRepo.includes('/') || !github.branch.trim()))"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Icon :icon="submitting ? 'lucide:loader-2' : (form.validate ? 'lucide:shield-check' : 'lucide:play')" class="w-4 h-4 flex-shrink-0" :class="{ 'animate-spin': submitting }" />
          <span>{{ submitting ? 'Submitting…' : (form.validate ? 'Run + Validate' : 'Run Task') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
