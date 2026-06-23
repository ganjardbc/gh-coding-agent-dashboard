<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import RunViewer from '@/components/runs/RunViewer.vue'
import { useJobDetail } from '@/composables/useJobs'
import type { RunData } from '@/types/run'
import type { JobDetail } from '@/types/job'

const route = useRoute()
const router = useRouter()
const runId = String(route.params.id)

const { job, loading, error, fetchJob, startPolling } = useJobDetail()

function fmtTime(ts: string | null | undefined) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function replayJob() {
  if (!job.value) return
  router.push({
    path: '/new-task',
    query: {
      repo: job.value.input.repo,
      task: job.value.input.task,
      validate: String(job.value.input.validate),
    },
  })
}

watch(job, (j) => {
  if (j && (j.status === 'queued' || j.status === 'running')) {
    startPolling(runId)
  }
})

onMounted(async () => {
  await fetchJob(runId)
  if (job.value && (job.value.status === 'queued' || job.value.status === 'running')) {
    startPolling(runId)
  }
})

// Cast job to RunData shape for RunViewer (shapes are compatible)
function asRunData(j: JobDetail): RunData {
  return j as unknown as RunData
}
</script>

<template>
  <div class="p-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <RouterLink to="/jobs" class="text-slate-400 hover:text-slate-600 text-sm transition-colors">
        ← Jobs
      </RouterLink>
      <span class="text-slate-300">/</span>
      <span class="font-mono text-xs text-slate-500">{{ runId }}</span>
      <StatusBadge v-if="job" :status="job.status" />
    </div>

    <LoadingState v-if="loading && !job" />
    <ErrorState v-else-if="error && !job" :message="error ?? ''" @retry="fetchJob(runId)" />

    <template v-else-if="job">
      <!-- Actions bar -->
      <div class="flex items-center justify-between mb-4">
        <div class="text-xs text-slate-500">
          Created {{ fmtTime(job.createdAt) }}
          <span v-if="job.retryCount" class="ml-2 text-amber-600">· {{ job.retryCount }} retries</span>
          <span v-if="job.status === 'queued' || job.status === 'running'" class="ml-2 text-amber-500">· polling…</span>
        </div>
        <div class="flex gap-2">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
            @click="fetchJob(runId)"
          >
            ↻ Refresh
          </button>
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors"
            @click="replayJob"
          >
            ↺ Replay
          </button>
        </div>
      </div>

      <!-- Linked run file -->
      <div v-if="job.jobId" class="mb-4 bg-blue-50 border border-blue-200 rounded p-3 flex items-center gap-2 text-xs">
        <span class="text-blue-600">Queue Job:</span>
        <code class="font-mono text-blue-800">{{ job.jobId }}</code>
      </div>

      <!-- Run viewer (shared with /runs/:file) -->
      <RunViewer :run="asRunData(job)" />
    </template>
  </div>
</template>
