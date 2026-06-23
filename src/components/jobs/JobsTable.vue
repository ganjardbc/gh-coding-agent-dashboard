<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import type { JobSummary, JobStatus } from '@/types/job'

defineProps<{
  jobs: JobSummary[]
  filterStatus: JobStatus | 'all'
}>()

function fmtTime(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function fmtTimeShort(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function duration(job: JobSummary): string {
  if (!job.startedAt || !job.finishedAt) return '—'
  const ms = new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60000)}m`
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div v-if="jobs.length === 0" class="px-5 py-10 text-center text-sm text-slate-400">
      No jobs match this filter
    </div>

    <template v-else>
      <!-- Desktop table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">ID</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">Repo</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">Task</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">Status</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">Created</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500 tracking-wider">Duration</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="hover:bg-slate-50/70 transition-colors cursor-pointer"
            >
              <td class="px-4 py-3">
                <RouterLink :to="`/jobs/${job.id}`" class="font-mono text-xs text-blue-600 hover:underline">
                  {{ job.id.slice(-12) }}
                </RouterLink>
              </td>
              <td class="px-4 py-3">
                <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                  {{ job.input.repo }}
                </span>
              </td>
              <td class="px-4 py-3 max-w-xs">
                <span class="text-xs text-slate-600 block truncate" :title="job.input.task">
                  {{ job.input.task }}
                </span>
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="job.status" />
              </td>
              <td class="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                {{ fmtTime(job.createdAt) }}
              </td>
              <td class="px-4 py-3 text-xs text-slate-400 font-mono">
                {{ duration(job) }}
              </td>
              <td class="px-4 py-3 text-right">
                <RouterLink
                  :to="`/jobs/${job.id}`"
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  View →
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="md:hidden divide-y divide-slate-100">
        <RouterLink
          v-for="job in jobs"
          :key="job.id"
          :to="`/jobs/${job.id}`"
          class="block px-4 py-3.5 hover:bg-slate-50 transition-colors active:bg-slate-100"
        >
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 flex-shrink-0">
                {{ job.input.repo }}
              </span>
              <span class="font-mono text-xs text-slate-400 truncate">{{ job.id.slice(-8) }}</span>
            </div>
            <StatusBadge :status="job.status" />
          </div>
          <p class="text-xs text-slate-600 line-clamp-2 mb-1.5 leading-relaxed">{{ job.input.task }}</p>
          <div class="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>{{ fmtTimeShort(job.createdAt) }}</span>
            <span v-if="job.startedAt && job.finishedAt">· {{ duration(job) }}</span>
          </div>
        </RouterLink>
      </div>
    </template>
  </div>
</template>
