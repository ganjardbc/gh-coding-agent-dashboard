<script setup lang="ts">
import { onMounted } from 'vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import HealthStatus from '@/components/dashboard/HealthStatus.vue'
import RecentJobs from '@/components/dashboard/RecentJobs.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import { useJobs } from '@/composables/useJobs'
import { useHealth } from '@/composables/useHealth'

const { jobs, loading: jobsLoading, fetch: fetchJobs, stats } = useJobs()
const { health, queueHealth, healthError, queueError, fetchHealth } = useHealth()

async function refresh() {
  await Promise.all([fetchJobs(), fetchHealth()])
}

onMounted(refresh)
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-2">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Overview</h1>
        <p class="text-xs text-slate-500 mt-0.5">System status and recent activity</p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
        @click="refresh"
      >
        ↻ Refresh
      </button>
    </div>

    <LoadingState v-if="jobsLoading && jobs.length === 0" />

    <template v-else>
      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        <StatsCard label="Total" :value="stats.total" />
        <StatsCard label="Queued" :value="stats.queued" color="blue" />
        <StatsCard label="Running" :value="stats.running" color="amber" />
        <StatsCard label="Completed" :value="stats.success" color="green" />
        <StatsCard label="Failed" :value="stats.failed" color="red" />
      </div>

      <!-- Health -->
      <div class="mb-4">
        <HealthStatus
          :health="health"
          :queue-health="queueHealth"
          :health-error="healthError"
          :queue-error="queueError"
        />
      </div>

      <!-- Recent jobs (latest 10) -->
      <RecentJobs :jobs="jobs.slice(0, 10)" />
    </template>
  </div>
</template>
