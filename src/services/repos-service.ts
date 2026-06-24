import { apiGet, apiPost, apiPut, apiDelete } from './api-client'

export interface Repository {
  key: string
  relPath: string
  isGitHub?: boolean
  buildCommand?: string
  lintCommand?: string
  testCommand?: string
  exists: boolean
}

export async function getRepositories(): Promise<Repository[]> {
  const res = await apiGet<{ success: boolean; repos: Repository[] }>('/repos')
  return res.repos
}

export async function addRepository(data: Omit<Repository, 'exists'>): Promise<{ success: boolean; exists: boolean }> {
  return apiPost<{ success: boolean; exists: boolean }>('/repos', data)
}

export async function updateRepository(key: string, data: Omit<Repository, 'key' | 'exists'>): Promise<{ success: boolean; exists: boolean }> {
  return apiPut<{ success: boolean; exists: boolean }>(`/repos/${key}`, data)
}

export async function deleteRepository(key: string, isGitHub = false): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/repos/${key}?isGitHub=${isGitHub}`)
}
