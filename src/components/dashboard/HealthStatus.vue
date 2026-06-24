<script setup lang="ts">
import type { HealthStatus, QueueHealth } from '@/types/health'
import { Icon } from '@iconify/vue'

defineProps<{
  health: HealthStatus | null
  queueHealth: QueueHealth | null
  healthError: string | null
  queueError: string | null
}>()
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg px-5 py-4">
    <div class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">System Health</div>
    <div class="flex flex-wrap gap-4">
      <!-- API health -->
      <div class="flex items-center gap-2">
        <Icon
          :icon="healthError ? 'lucide:alert-circle' : health?.ok ? 'lucide:check-circle-2' : 'lucide:help-circle'"
          :class="[
            'w-4 h-4 flex-shrink-0',
            healthError ? 'text-red-500' : health?.ok ? 'text-green-500' : 'text-slate-300',
          ]"
        />
        <span class="text-sm text-slate-700">API</span>
        <span
          :class="['text-xs font-mono', healthError ? 'text-red-500' : 'text-slate-500']"
        >
          {{ healthError ? 'unreachable' : health?.ok ? 'online' : '—' }}
        </span>
      </div>

      <!-- Queue health -->
      <div class="flex items-center gap-2">
        <Icon
          :icon="queueError ? 'lucide:alert-circle' : queueHealth ? 'lucide:check-circle-2' : 'lucide:help-circle'"
          :class="[
            'w-4 h-4 flex-shrink-0',
            queueError ? 'text-red-500' : queueHealth ? 'text-green-500' : 'text-slate-300',
          ]"
        />
        <span class="text-sm text-slate-700">Queue</span>
        <span
          :class="['text-xs font-mono', queueError ? 'text-red-500' : 'text-slate-500']"
        >
          {{ queueError ? 'unavailable' : queueHealth ? `${queueHealth.waiting}w / ${queueHealth.active}a / ${queueHealth.failed}f` : '—' }}
        </span>
      </div>

      <div v-if="health?.timestamp" class="text-xs text-slate-400 font-mono ml-auto self-center">
        {{ new Date(health.timestamp).toLocaleTimeString() }}
      </div>
    </div>
  </div>
</template>
