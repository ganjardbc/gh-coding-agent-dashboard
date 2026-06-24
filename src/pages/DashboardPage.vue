<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import StatsCard from '@/components/dashboard/StatsCard.vue'
import HealthStatus from '@/components/dashboard/HealthStatus.vue'
import RecentJobs from '@/components/dashboard/RecentJobs.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import { useJobs } from '@/composables/useJobs'
import { useHealth } from '@/composables/useHealth'

const { jobs, loading: jobsLoading, fetch: fetchJobs, stats } = useJobs()
const { health, queueHealth, healthError, queueError, fetchHealth } = useHealth()

const githubLinkedCount = computed(() => jobs.value.filter((j) => !!j.github).length)
const webhookCount = computed(() => jobs.value.filter((j) => j.source?.type === 'github-webhook').length)
const recentGitHubJobs = computed(() => jobs.value.filter((j) => !!j.github).slice(0, 5))

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
        <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>

    <LoadingState v-if="jobsLoading && jobs.length === 0" />

    <template v-else>
      <!-- Health -->
      <div class="mb-4">
        <HealthStatus
          :health="health"
          :queue-health="queueHealth"
          :health-error="healthError"
          :queue-error="queueError"
        />
      </div>

      <!-- Core stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
        <StatsCard label="Total" :value="stats.total" />
        <StatsCard label="Queued" :value="stats.queued" color="blue" />
        <StatsCard label="Running" :value="stats.running" color="amber" />
        <StatsCard label="Completed" :value="stats.success" color="green" />
        <StatsCard label="Failed" :value="stats.failed" color="red" />
      </div>

      <!-- GitHub stats row -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold font-mono text-violet-600">{{ githubLinkedCount }}</div>
            <div class="text-xs text-slate-500 mt-0.5">GitHub-linked jobs</div>
          </div>
          <RouterLink to="/github-jobs?filter=all" class="text-xs text-violet-600 hover:text-violet-800">View →</RouterLink>
        </div>
        <div class="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold font-mono text-violet-500">{{ webhookCount }}</div>
            <div class="text-xs text-slate-500 mt-0.5">Webhook-triggered</div>
          </div>
          <RouterLink to="/github-jobs?filter=webhook" class="text-xs text-violet-600 hover:text-violet-800">View →</RouterLink>
        </div>
      </div>

      <!-- Recent GitHub jobs -->
      <div v-if="recentGitHubJobs.length > 0" class="mb-4">
        <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent GitHub Jobs</span>
            <RouterLink to="/github-jobs" class="text-xs text-blue-600 hover:text-blue-800">View all →</RouterLink>
          </div>
          <div class="divide-y divide-slate-100">
            <RouterLink
              v-for="job in recentGitHubJobs"
              :key="job.id"
              :to="`/jobs/${job.id}`"
              class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors text-xs"
            >
              <span class="font-mono text-blue-600 w-20 flex-shrink-0 truncate">{{ job.id.slice(-8) }}</span>
              <span class="font-mono text-violet-700 truncate flex-1">
                {{ job.github!.owner }}/{{ job.github!.repo }}
                <span v-if="job.github!.branch" class="text-slate-400"> · {{ job.github!.branch }}</span>
              </span>
              <span
                v-if="job.github!.issueNumber"
                class="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0"
              >#{{ job.github!.issueNumber }}</span>
              <span
                v-if="job.github!.prNumber"
                class="bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-mono flex-shrink-0"
              >PR#{{ job.github!.prNumber }}</span>
              <span
                :class="[
                  'flex-shrink-0 px-1.5 py-0.5 rounded font-medium',
                  job.status === 'success' ? 'bg-green-50 text-green-600' :
                  job.status === 'failed' ? 'bg-red-50 text-red-600' :
                  job.status === 'running' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                ]"
              >{{ job.status }}</span>
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Recent jobs (latest 10) -->
      <RecentJobs :jobs="jobs.slice(0, 10)" />
    </template>
  </div>
</template>
