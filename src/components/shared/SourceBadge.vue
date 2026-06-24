<script setup lang="ts">
import type { JobSourceType } from '@/types/github'
import { Icon } from '@iconify/vue'

defineProps<{ type: JobSourceType }>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium font-mono',
      type === 'github-webhook'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-slate-100 text-slate-600',
    ]"
  >
    <Icon
      :icon="type === 'github-webhook' ? 'lucide:webhook' : 'lucide:user'"
      class="w-3.5 h-3.5 flex-shrink-0"
    />
    {{ type === 'github-webhook' ? 'webhook' : 'manual' }}
  </span>
</template>
