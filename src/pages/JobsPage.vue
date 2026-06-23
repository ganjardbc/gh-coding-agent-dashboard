<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import JobsTable from '@/components/jobs/JobsTable.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useJobs } from '@/composables/useJobs'
import type { JobStatus } from '@/types/job'

const { jobs, loading, error, fetch, stats, hasActiveJobs } = useJobs()

const filterStatus = ref<JobStatus | 'all'>('all')

const statuses: Array<{ value: JobStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'success', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const filteredJobs = computed(() => {
  if (filterStatus.value === 'all') return jobs.value
  return jobs.value.filter((j) => j.status === filterStatus.value)
})

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
  <div class="p-6 max-w-6xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Jobs</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ stats.total }} total · {{ stats.running }} running
          <span v-if="hasActiveJobs" class="text-amber-500"> · auto-refreshing</span>
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
        @click="fetch"
      >
        ↻ Refresh
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-1 mb-4 bg-white border border-slate-200 rounded-lg p-1 w-fit">
      <button
        v-for="s in statuses"
        :key="s.value"
        :class="[
          'px-3 py-1.5 text-xs rounded-md transition-colors font-medium',
          filterStatus === s.value
            ? 'bg-slate-800 text-white'
            : 'text-slate-500 hover:text-slate-700',
        ]"
        @click="filterStatus = s.value"
      >
        {{ s.label }}
        <span
          v-if="s.value !== 'all'"
          class="ml-1 font-mono"
        >
          ({{ stats[s.value as JobStatus] ?? 0 }})
        </span>
      </button>
    </div>

    <LoadingState v-if="loading && jobs.length === 0" />
    <ErrorState v-else-if="error" :message="error" @retry="fetch" />
    <JobsTable v-else :jobs="filteredJobs" :filter-status="filterStatus" />
  </div>
</template>
