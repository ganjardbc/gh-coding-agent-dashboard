<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRunTask } from '@/composables/useRunTask'
import { getRepos } from '@/services/health-service'
import type { GitHubJobContext } from '@/types/github'

const router = useRouter()
const route = useRoute()
const { submitting, result, error, submitTask, reset } = useRunTask()

const repos = ref<string[]>([])
const showGitHub = ref(false)

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

async function loadRepos() {
  try {
    repos.value = await getRepos()
    if (repos.value.length && !form.value.repo) {
      form.value.repo = repos.value[0]
    }
  } catch {
    repos.value = ['undangabi', 'coderium', 'umkm-pos']
    if (!form.value.repo) form.value.repo = repos.value[0]
  }
}

onMounted(async () => {
  await loadRepos()
  if (route.query.repo) form.value.repo = String(route.query.repo)
  if (route.query.task) form.value.task = String(route.query.task)
  if (route.query.validate) form.value.validate = route.query.validate === 'true'
  // GitHub replay params
  if (route.query.ghOwner) {
    showGitHub.value = true
    github.value.owner = String(route.query.ghOwner)
    github.value.repo = String(route.query.ghRepo ?? '')
    github.value.branch = String(route.query.ghBranch ?? '')
    github.value.baseBranch = String(route.query.ghBaseBranch ?? '')
    github.value.issueNumber = String(route.query.ghIssueNumber ?? '')
    github.value.prNumber = String(route.query.ghPrNumber ?? '')
  }
})

function buildGitHubContext(): GitHubJobContext | undefined {
  if (!showGitHub.value || !github.value.owner || !github.value.repo) return undefined
  return {
    owner: github.value.owner,
    repo: github.value.repo,
    branch: github.value.branch || undefined,
    baseBranch: github.value.baseBranch || undefined,
    issueNumber: github.value.issueNumber ? Number(github.value.issueNumber) : undefined,
    prNumber: github.value.prNumber ? Number(github.value.prNumber) : undefined,
  }
}

async function handleSubmit() {
  if (!form.value.repo || !form.value.task.trim()) return
  const ghCtx = buildGitHubContext()
  const r = await submitTask(form.value.repo, form.value.task.trim(), form.value.validate, ghCtx)
  if (r) {
    setTimeout(() => {
      router.push(`/jobs/${r.runId}`)
    }, 1500)
  }
}

function startOver() {
  reset()
  form.value.task = ''
  showGitHub.value = false
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
    <div v-if="result" class="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-green-600 text-lg">✓</span>
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
          class="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
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
      <div class="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <!-- Repo -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Repository</label>
          <select
            v-model="form.repo"
            class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option v-for="repo in repos" :key="repo" :value="repo">{{ repo }}</option>
          </select>
        </div>

        <!-- Task -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Task</label>
          <textarea
            v-model="form.task"
            rows="6"
            placeholder="Describe the coding task in detail…"
            class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono"
            required
          />
        </div>

        <!-- Mode -->
        <div>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <input
              v-model="form.validate"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-slate-700">Run with validation (build / lint / test)</span>
          </label>
          <p class="text-xs text-slate-400 mt-1 ml-6">
            Enables build, lint, and test execution steps after planning
          </p>
        </div>
      </div>

      <!-- GitHub section toggle -->
      <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition-colors"
          @click="showGitHub = !showGitHub"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-slate-700">GitHub Context</span>
            <span class="text-xs text-slate-400">optional</span>
            <span
              v-if="showGitHub && github.owner && github.repo"
              class="font-mono text-xs bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded"
            >{{ github.owner }}/{{ github.repo }}</span>
          </div>
          <span class="text-slate-400 text-xs">{{ showGitHub ? '▲' : '▼' }}</span>
        </button>

        <div v-if="showGitHub" class="px-5 pb-5 pt-1 border-t border-slate-100 space-y-3">
          <p class="text-xs text-slate-400 mb-3">
            Link this job to a GitHub repository, branch, issue, or pull request.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Owner <span class="text-red-400">*</span></label>
              <input
                v-model="github.owner"
                type="text"
                placeholder="e.g. ganjardbc"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Repo <span class="text-red-400">*</span></label>
              <input
                v-model="github.repo"
                type="text"
                placeholder="e.g. undangabi-v2"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Branch</label>
              <input
                v-model="github.branch"
                type="text"
                placeholder="e.g. feature/auth-refactor"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Base branch</label>
              <input
                v-model="github.baseBranch"
                type="text"
                placeholder="e.g. main"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Issue #</label>
              <input
                v-model="github.issueNumber"
                type="number"
                min="1"
                placeholder="e.g. 12"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">PR #</label>
              <input
                v-model="github.prNumber"
                type="number"
                min="1"
                placeholder="e.g. 34"
                class="w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 font-mono"
              />
            </div>
          </div>

          <div v-if="showGitHub && (!github.owner || !github.repo)" class="text-xs text-amber-600">
            Owner and Repo are required when GitHub context is enabled.
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <button
          type="submit"
          :disabled="submitting || !form.repo || !form.task.trim() || (showGitHub && (!github.owner || !github.repo))"
          class="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-md transition-colors font-medium"
        >
          <span v-if="submitting">Submitting…</span>
          <span v-else>{{ form.validate ? 'Run + Validate' : 'Run Task' }}</span>
        </button>
        <button
          type="button"
          class="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          @click="form.task = ''"
        >
          Clear
        </button>
      </div>
    </form>
  </div>
</template>
