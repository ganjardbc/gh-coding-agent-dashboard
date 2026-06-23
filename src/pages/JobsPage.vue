<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import JobsTable from '@/components/jobs/JobsTable.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useJobs } from '@/composables/useJobs'
import type { JobStatus } from '@/types/job'

const { jobs, loading, error, fetch, stats, hasActiveJobs } = useJobs()

type FilterValue = JobStatus | 'all' | 'github' | 'webhook'

const filterStatus = ref<FilterValue>('all')

const statuses: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'success', label: 'Done' },
  { value: 'failed', label: 'Failed' },
  { value: 'github', label: 'GitHub' },
  { value: 'webhook', label: 'Webhook' },
]

const githubCount = computed(() => jobs.value.filter((j) => !!j.github).length)
const webhookCount = computed(() => jobs.value.filter((j) => j.source?.type === 'github-webhook').length)

const filteredJobs = computed(() => {
  if (filterStatus.value === 'all') return jobs.value
  if (filterStatus.value === 'github') return jobs.value.filter((j) => !!j.github)
  if (filterStatus.value === 'webhook') return jobs.value.filter((j) => j.source?.type === 'github-webhook')
  return jobs.value.filter((j) => j.status === filterStatus.value)
})

function filterCount(value: FilterValue): number | null {
  if (value === 'all') return null
  if (value === 'github') return githubCount.value
  if (value === 'webhook') return webhookCount.value
  return stats.value[value as JobStatus] ?? 0
}

let pollTimer: ReturnType<typeof setInterval> | null = null

watch(hasActiveJobs, (active) => {
  if (active && !pollTimer) {
    pollTimer = setInterval(fetch, 5000)
  } else if (!active && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

onMounted(fetch)

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 gap-2">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Jobs</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ stats.total }} total · {{ stats.running }} running
          <span v-if="githubCount > 0" class="text-violet-500"> · {{ githubCount }} GitHub-linked</span>
          <span v-if="hasActiveJobs" class="text-amber-500"> · auto-refreshing</span>
        </p>
      </div>
      <button
        class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
        @click="fetch"
      >
        ↻ Refresh
      </button>
    </div>

    <!-- Filter tabs — scrollable on mobile -->
    <div class="mb-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div class="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit min-w-max">
        <button
          v-for="s in statuses"
          :key="s.value"
          :class="[
            'px-3 py-1.5 text-xs rounded-md transition-colors font-medium whitespace-nowrap',
            filterStatus === s.value
              ? s.value === 'github' || s.value === 'webhook'
                ? 'bg-violet-700 text-white'
                : 'bg-slate-800 text-white'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="filterStatus = s.value"
        >
          {{ s.label }}
          <span v-if="filterCount(s.value) !== null" class="ml-1 font-mono">
            ({{ filterCount(s.value) }})
          </span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && jobs.length === 0" />
    <ErrorState v-else-if="error" :message="error" @retry="fetch" />
    <JobsTable v-else :jobs="filteredJobs" :filter-status="filterStatus" />
  </div>
</template>
