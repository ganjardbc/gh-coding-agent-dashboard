import { ref, computed, onUnmounted } from 'vue'
import { getJobs, getJobById } from '@/services/jobs-service'
import type { JobSummary, JobDetail, JobStatus } from '@/types/job'

export function useJobs() {
  const jobs = ref<JobSummary[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      jobs.value = await getJobs()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  const stats = computed(() => {
    const counts: Record<JobStatus | 'total', number> = {
      total: jobs.value.length,
      pending: 0,
      queued: 0,
      running: 0,
      success: 0,
      failed: 0,
    }
    for (const job of jobs.value) {
      if (job.status in counts) counts[job.status]++
    }
    return counts
  })

  const hasActiveJobs = computed(() =>
    jobs.value.some((j) => j.status === 'queued' || j.status === 'running'),
  )

  return { jobs, loading, error, fetch, stats, hasActiveJobs }
}

export function useJobDetail() {
  const job = ref<JobDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let pollTimer: ReturnType<typeof setTimeout> | null = null

  async function fetchJob(id: string) {
    loading.value = true
    error.value = null
    try {
      job.value = await getJobById(id)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  function startPolling(id: string, intervalMs = 3000) {
    stopPolling()
    pollTimer = setInterval(() => {
      const s = job.value?.status
      if (s === 'queued' || s === 'running') {
        fetchJob(id)
      } else {
        stopPolling()
      }
    }, intervalMs)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(stopPolling)

  return { job, loading, error, fetchJob, startPolling, stopPolling }
}
