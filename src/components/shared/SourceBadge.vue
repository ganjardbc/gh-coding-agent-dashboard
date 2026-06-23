<script setup lang="ts">
import type { JobSourceType } from '@/types/github'

defineProps<{ type: JobSourceType }>()
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
      type === 'github-webhook'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-slate-100 text-slate-600',
    ]"
  >
    <span v-if="type === 'github-webhook'">⬡</span>
    <span v-else>◎</span>
    {{ type === 'github-webhook' ? 'webhook' : 'manual' }}
  </span>
</template>
