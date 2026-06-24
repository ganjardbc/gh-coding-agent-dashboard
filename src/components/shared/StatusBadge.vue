<script setup lang="ts">
import type { JobStatus } from '@/types/job'
import { Icon } from '@iconify/vue'

const props = defineProps<{ status: JobStatus | string }>()

const classes: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  queued: 'bg-blue-100 text-blue-700',
  running: 'bg-amber-100 text-amber-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const icons: Record<string, string> = {
  running: 'lucide:loader-2',
  queued: 'lucide:clock',
  success: 'lucide:check-circle-2',
  failed: 'lucide:alert-circle',
  pending: 'lucide:help-circle',
}
</script>

<template>
  <span
    :class="['inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono', classes[props.status] ?? 'bg-slate-100 text-slate-600']"
  >
    <Icon
      :icon="icons[props.status] ?? 'lucide:help-circle'"
      :class="['w-3.5 h-3.5 flex-shrink-0', props.status === 'running' ? 'animate-spin' : '']"
    />
    {{ props.status }}
  </span>
</template>
