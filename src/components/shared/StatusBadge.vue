<script setup lang="ts">
import type { JobStatus } from '@/types/job'

const props = defineProps<{ status: JobStatus | string }>()

const classes: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  queued: 'bg-blue-100 text-blue-700',
  running: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const dots: Record<string, string> = {
  running: 'bg-amber-500 animate-pulse',
  queued: 'bg-blue-500',
  success: 'bg-green-500',
  failed: 'bg-red-500',
  pending: 'bg-slate-400',
}
</script>

<template>
  <span
    :class="['inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium font-mono', classes[props.status] ?? 'bg-slate-100 text-slate-600']"
  >
    <span
      :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', dots[props.status] ?? 'bg-slate-400']"
    />
    {{ props.status }}
  </span>
</template>
