<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import type { JobSummary } from '@/types/job'

defineProps<{ jobs: JobSummary[] }>()

function fmtTime(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function fmtTimeShort(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
      <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent Jobs</span>
      <RouterLink to="/jobs" class="text-xs text-blue-600 hover:text-blue-800">View all →</RouterLink>
    </div>
    <div v-if="jobs.length === 0" class="px-5 py-6 text-center text-sm text-slate-400">
      No jobs yet
    </div>

    <template v-else>
      <!-- Desktop table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="job in jobs"
              :key="job.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-5 py-3">
                <RouterLink :to="`/jobs/${job.id}`" class="font-mono text-xs text-blue-600 hover:underline">
                  {{ job.id.slice(-8) }}
                </RouterLink>
              </td>
              <td class="px-3 py-3">
                <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{{ job.input.repo }}</span>
              </td>
              <td class="px-3 py-3 max-w-xs">
                <span class="text-slate-600 text-xs truncate block">{{ job.input.task }}</span>
              </td>
              <td class="px-3 py-3">
                <StatusBadge :status="job.status" />
              </td>
              <td class="px-3 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">
                {{ fmtTime(job.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="sm:hidden divide-y divide-slate-100">
        <RouterLink
          v-for="job in jobs"
          :key="job.id"
          :to="`/jobs/${job.id}`"
          class="block px-4 py-3 hover:bg-slate-50 transition-colors active:bg-slate-100"
        >
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 flex-shrink-0">
                {{ job.input.repo }}
              </span>
              <span class="font-mono text-xs text-slate-400">{{ job.id.slice(-6) }}</span>
            </div>
            <StatusBadge :status="job.status" />
          </div>
          <p class="text-xs text-slate-600 truncate mb-1">{{ job.input.task }}</p>
          <span class="text-xs text-slate-400 font-mono">{{ fmtTimeShort(job.createdAt) }}</span>
        </RouterLink>
      </div>
    </template>
  </div>
</template>
