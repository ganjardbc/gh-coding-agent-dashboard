<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRunTask } from '@/composables/useRunTask'
import { getRepos } from '@/services/health-service'

const router = useRouter()
const route = useRoute()
const { submitting, result, error, submitTask, reset } = useRunTask()

const repos = ref<string[]>([])
const form = ref({
  repo: '',
  task: '',
  validate: false,
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
  // Pre-fill from query params (used by Replay flow)
  if (route.query.repo) form.value.repo = String(route.query.repo)
  if (route.query.task) form.value.task = String(route.query.task)
  if (route.query.validate) form.value.validate = route.query.validate === 'true'
})

async function handleSubmit() {
  if (!form.value.repo || !form.value.task.trim()) return
  const r = await submitTask(form.value.repo, form.value.task.trim(), form.value.validate)
  if (r) {
    // Auto-navigate to job detail after a short delay
    setTimeout(() => {
      router.push(`/jobs/${r.runId}`)
    }, 1500)
  }
}

function startOver() {
  reset()
  form.value.task = ''
}
</script>

<template>
  <div class="p-6 max-w-2xl">
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
    <form v-else class="bg-white border border-slate-200 rounded-lg p-5 space-y-4" @submit.prevent="handleSubmit">
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
        <p class="text-xs text-slate-400 mt-1 ml-6.5">
          Enables build, lint, and test execution steps after planning
        </p>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-700">
        {{ error }}
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-1">
        <button
          type="submit"
          :disabled="submitting || !form.repo || !form.task.trim()"
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
