<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import type { JobSummary } from '@/types/job'

defineProps<{ jobs: JobSummary[] }>()

function fmtTime(ts: string | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div class="px-5 py-3 border-b border-slate-100">
      <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Recent Jobs</span>
    </div>
    <div v-if="jobs.length === 0" class="px-5 py-6 text-center text-sm text-slate-400">
      No jobs yet
    </div>
    <table v-else class="w-full text-sm">
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
</template>
