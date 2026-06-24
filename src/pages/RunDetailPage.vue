<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import RunViewer from '@/components/runs/RunViewer.vue'
import { useRunDetail } from '@/composables/useRuns'

const route = useRoute()
const router = useRouter()
const file = String(route.params.file)

const { run, loading, error, fetchRun } = useRunDetail()

onMounted(() => fetchRun(file))
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Breadcrumb -->
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5">
      <button @click="router.back()" class="text-slate-400 hover:text-slate-600 text-sm transition-colors flex-shrink-0 flex items-center gap-1">
        <Icon icon="lucide:arrow-left" class="w-3.5 h-3.5" /> Runs
      </button>
      <span class="text-slate-300">/</span>
      <span class="font-mono text-xs text-slate-500 break-all">{{ file }}</span>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error ?? ''" @retry="fetchRun(file)" />
    <RunViewer v-else-if="run" :run="run" />
  </div>
</template>
