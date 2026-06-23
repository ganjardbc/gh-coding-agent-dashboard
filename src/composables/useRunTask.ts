import { ref } from 'vue'
import { createJob, validateTask } from '@/services/jobs-service'
import type { CreateJobResult } from '@/types/job'

export function useRunTask() {
  const submitting = ref(false)
  const result = ref<CreateJobResult | null>(null)
  const error = ref<string | null>(null)

  async function submitTask(repo: string, task: string, validate = false): Promise<CreateJobResult | null> {
    submitting.value = true
    error.value = null
    result.value = null
    try {
      result.value = validate
        ? await validateTask(repo, task)
        : await createJob(repo, task)
    } catch (e) {
      error.value = String(e)
    } finally {
      submitting.value = false
    }
    return result.value
  }

  function reset() {
    result.value = null
    error.value = null
  }

  return { submitting, result, error, submitTask, reset }
}
