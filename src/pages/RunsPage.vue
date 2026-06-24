<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import { useRuns } from '@/composables/useRuns'

const { runs, loading, error, fetchRuns } = useRuns()

function runIdFromFile(filename: string) {
  return filename.replace('.json', '')
}

onMounted(fetchRuns)
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5 gap-2">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Runs</h1>
        <p class="text-xs text-slate-500 mt-0.5">Raw run output files</p>
      </div>
      <button
        class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
        @click="fetchRuns"
      >
        <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchRuns" />
    <EmptyState
      v-else-if="runs.length === 0"
      icon="lucide:file-text"
      title="No runs recorded"
      description="Submit a new coding agent task to generate execution run logs."
    />

    <div v-else class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <!-- Desktop table -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500">Run ID</th>
              <th class="px-4 py-2.5 text-left text-xs font-medium text-slate-500">File</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="file in runs"
              :key="file"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="px-4 py-3">
                <code class="text-xs text-slate-700 font-mono">{{ runIdFromFile(file) }}</code>
              </td>
              <td class="px-4 py-3">
                <code class="text-xs text-slate-400 font-mono">{{ file }}</code>
              </td>
              <td class="px-4 py-3 text-right">
                <RouterLink :to="`/runs/${file}`" class="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                  Inspect <Icon icon="lucide:arrow-right" class="w-3 h-3" />
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile list -->
      <div class="sm:hidden divide-y divide-slate-100">
        <RouterLink
          v-for="file in runs"
          :key="file"
          :to="`/runs/${file}`"
          class="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors active:bg-slate-100 gap-3"
        >
          <div class="min-w-0">
            <p class="font-mono text-xs text-slate-700 truncate">{{ runIdFromFile(file) }}</p>
            <p class="font-mono text-xs text-slate-400 truncate mt-0.5">{{ file }}</p>
          </div>
          <span class="text-xs text-blue-600 flex-shrink-0 inline-flex items-center gap-1">Inspect <Icon icon="lucide:arrow-right" class="w-3 h-3" /></span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
