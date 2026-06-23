<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import RunViewer from '@/components/runs/RunViewer.vue'
import { useRunDetail } from '@/composables/useRuns'

const route = useRoute()
const file = String(route.params.file)

const { run, loading, error, fetchRun } = useRunDetail()

onMounted(() => fetchRun(file))
</script>

<template>
  <div class="p-6 max-w-4xl">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5">
      <RouterLink to="/runs" class="text-slate-400 hover:text-slate-600 text-sm transition-colors">
        ← Runs
      </RouterLink>
      <span class="text-slate-300">/</span>
      <span class="font-mono text-xs text-slate-500">{{ file }}</span>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error ?? ''" @retry="fetchRun(file)" />
    <RunViewer v-else-if="run" :run="run" />
  </div>
</template>
