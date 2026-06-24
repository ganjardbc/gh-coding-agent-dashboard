<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import JobsTable from '@/components/jobs/JobsTable.vue'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'
import { useJobs } from '@/composables/useJobs'

const route = useRoute()
const router = useRouter()
const { jobs, loading, error, fetch, hasActiveJobs } = useJobs()

type FilterValue = 'all' | 'webhook' | 'manual'

const filterValue = ref<FilterValue>((route.query.filter as FilterValue) || 'all')

// Sync ref update to URL query parameter
watch(filterValue, (newVal) => {
  router.replace({ query: { ...route.query, filter: newVal } })
})

// Sync URL query parameter changes back to ref (e.g. Back button)
watch(() => route.query.filter, (newVal) => {
  if (newVal && ['all', 'webhook', 'manual'].includes(newVal as string)) {
    filterValue.value = newVal as FilterValue
  } else {
    filterValue.value = 'all'
  }
})

const tabs: Array<{ value: FilterValue; label: string }> = [
  { value: 'all', label: 'All GitHub Runs' },
  { value: 'webhook', label: 'Webhook Triggers' },
  { value: 'manual', label: 'Manual GitHub Runs' },
]

// Only select jobs that are GitHub-linked
const githubJobs = computed(() => jobs.value.filter((j) => !!j.github))

const filteredJobs = computed(() => {
  if (filterValue.value === 'all') return githubJobs.value
  if (filterValue.value === 'webhook') {
    return githubJobs.value.filter((j) => j.source?.type === 'github-webhook')
  }
  if (filterValue.value === 'manual') {
    return githubJobs.value.filter((j) => j.source?.type !== 'github-webhook')
  }
  return githubJobs.value
})

const stats = computed(() => {
  const all = githubJobs.value.length
  const webhook = githubJobs.value.filter((j) => j.source?.type === 'github-webhook').length
  const manual = all - webhook
  return { all, webhook, manual }
})

function getCount(tabValue: FilterValue): number {
  return stats.value[tabValue]
}

let pollTimer: ReturnType<typeof setInterval> | null = null

watch(hasActiveJobs, (active) => {
  if (active && !pollTimer) {
    pollTimer = setInterval(fetch, 5000)
  } else if (!active && pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})

onMounted(fetch)

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 gap-2">
      <div>
        <h1 class="text-xl font-semibold text-slate-800 flex items-center gap-2">
          GitHub Runs
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          {{ stats.all }} total GitHub jobs · {{ stats.webhook }} via Webhooks · {{ stats.manual }} manual
          <span v-if="hasActiveJobs" class="text-amber-500"> · auto-refreshing</span>
        </p>
      </div>
      <button
        class="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors"
        @click="fetch"
      >
        <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>

    <!-- Filter tabs — scrollable on mobile -->
    <div class="mb-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div class="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit min-w-max">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="[
            'px-3 py-1.5 text-xs rounded-md transition-colors font-medium whitespace-nowrap',
            filterValue === tab.value
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          ]"
          @click="filterValue = tab.value"
        >
          {{ tab.label }}
          <span class="ml-1 font-mono">({{ getCount(tab.value) }})</span>
        </button>
      </div>
    </div>

    <LoadingState v-if="loading && jobs.length === 0" />
    <ErrorState v-else-if="error" :message="error" @retry="fetch" />
    <JobsTable v-else :jobs="filteredJobs" filter-status="github" />
  </div>
</template>
