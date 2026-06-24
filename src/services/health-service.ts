import { apiGet } from './api-client'
import type { HealthStatus, QueueHealth } from '@/types/health'
import type { Repository } from './repos-service'

export async function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>('/health')
}

export async function getQueueHealth(): Promise<QueueHealth> {
  return apiGet<QueueHealth>('/queue/health')
}

export async function getRepos(): Promise<Repository[]> {
  const res = await apiGet<{ success: boolean; repos: Repository[] }>('/repos')
  return res.repos
}
