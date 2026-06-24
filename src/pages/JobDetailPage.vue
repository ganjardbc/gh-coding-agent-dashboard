<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import SourceBadge from '@/components/shared/SourceBadge.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import RunViewer from '@/components/runs/RunViewer.vue'
import GitHubContextPanel from '@/components/jobs/GitHubContextPanel.vue'
import GitHubFeedbackPanel from '@/components/jobs/GitHubFeedbackPanel.vue'
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
  const query: Record<string, string> = {
    repo: job.value.input.repo,
    task: job.value.input.task,
    validate: String(job.value.input.validate),
  }
  const gh = job.value.github
  if (gh) {
    query.ghOwner = gh.owner
    query.ghRepo = gh.repo
    if (gh.branch) query.ghBranch = gh.branch
    if (gh.baseBranch) query.ghBaseBranch = gh.baseBranch
    if (gh.issueNumber != null) query.ghIssueNumber = String(gh.issueNumber)
    if (gh.prNumber != null) query.ghPrNumber = String(gh.prNumber)
  }
  router.push({ path: '/new-task', query })
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

function asRunData(j: JobDetail): RunData {
  return j as unknown as RunData
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Breadcrumb -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5">
      <button @click="router.back()" class="text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0 flex items-center gap-1">
        <Icon icon="lucide:arrow-left" class="w-3.5 h-3.5" /> Jobs
      </button>
      <span class="text-slate-300">/</span>
      <span class="font-mono text-xs text-slate-500 break-all">{{ runId }}</span>
      <StatusBadge v-if="job" :status="job.status" />
      <SourceBadge v-if="job?.source" :type="job.source.type" />
    </div>

    <LoadingState v-if="loading && !job" />
    <ErrorState v-else-if="error && !job" :message="error ?? ''" @retry="fetchJob(runId)" />

    <template v-else-if="job">
      <!-- Actions bar -->
      <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div class="text-xs text-slate-500">
          Created {{ fmtTime(job.createdAt) }}
          <span v-if="job.retryCount" class="ml-2 text-amber-600">· {{ job.retryCount }} retries</span>
          <span v-if="job.status === 'queued' || job.status === 'running'" class="ml-2 text-amber-500">· polling…</span>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
            @click="fetchJob(runId)"
          >
            <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-md transition-colors"
            @click="replayJob"
          >
            <Icon icon="lucide:rotate-ccw" class="w-3.5 h-3.5" /> Replay
          </button>
        </div>
      </div>

      <!-- GitHub context -->
      <div v-if="job.github" class="mb-4">
        <GitHubContextPanel :github="job.github" :source="job.source" />
      </div>

      <!-- GitHub feedback -->
      <div v-if="job.githubFeedback" class="mb-4">
        <GitHubFeedbackPanel :feedback="job.githubFeedback" />
      </div>

      <!-- Linked run file -->
      <div v-if="job.jobId" class="mb-4 bg-blue-50 border border-blue-200 rounded p-3 flex flex-wrap items-center gap-2 text-xs">
        <span class="text-blue-600">Queue Job:</span>
        <code class="font-mono text-blue-800 break-all">{{ job.jobId }}</code>
      </div>

      <!-- Run viewer -->
      <RunViewer :run="asRunData(job)" />
    </template>
  </div>
</template>
