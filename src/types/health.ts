export interface HealthStatus {
  ok: boolean
  timestamp: string
}

export interface QueueHealth {
  success: boolean
  queue: string
  waiting: number
  active: number
  failed: number
  redis: string
}
