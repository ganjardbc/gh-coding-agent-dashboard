import { ref } from 'vue'
import { getRuns, getRunByFile } from '@/services/runs-service'
import type { RunData } from '@/types/run'

export function useRuns() {
  const runs = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRuns() {
    loading.value = true
    error.value = null
    try {
      runs.value = await getRuns()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  return { runs, loading, error, fetchRuns }
}

export function useRunDetail() {
  const run = ref<RunData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRun(file: string) {
    loading.value = true
    error.value = null
    try {
      run.value = await getRunByFile(file)
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  return { run, loading, error, fetchRun }
}
