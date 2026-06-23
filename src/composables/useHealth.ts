import { ref } from 'vue'
import { getHealth, getQueueHealth } from '@/services/health-service'
import type { HealthStatus, QueueHealth } from '@/types/health'

export function useHealth() {
  const health = ref<HealthStatus | null>(null)
  const queueHealth = ref<QueueHealth | null>(null)
  const healthError = ref<string | null>(null)
  const queueError = ref<string | null>(null)
  const loading = ref(false)

  async function fetchHealth() {
    loading.value = true
    await Promise.allSettled([
      getHealth()
        .then((h) => {
          health.value = h
          healthError.value = null
        })
        .catch((e) => {
          healthError.value = String(e)
          health.value = null
        }),
      getQueueHealth()
        .then((q) => {
          queueHealth.value = q
          queueError.value = null
        })
        .catch((e) => {
          queueError.value = String(e)
          queueHealth.value = null
        }),
    ])
    loading.value = false
  }

  return { health, queueHealth, healthError, queueError, loading, fetchHealth }
}
