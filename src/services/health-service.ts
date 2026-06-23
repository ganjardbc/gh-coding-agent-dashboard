import { apiGet } from './api-client'
import type { HealthStatus, QueueHealth } from '@/types/health'

export async function getHealth(): Promise<HealthStatus> {
  return apiGet<HealthStatus>('/health')
}

export async function getQueueHealth(): Promise<QueueHealth> {
  return apiGet<QueueHealth>('/queue/health')
}

export async function getRepos(): Promise<string[]> {
  const res = await apiGet<{ success: boolean; repos: string[] }>('/repos')
  return res.repos
}
