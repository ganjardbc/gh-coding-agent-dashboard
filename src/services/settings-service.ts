import { apiGet, apiPost } from './api-client'

export interface SettingsResponse {
  success: boolean
  settings: Record<string, string>
}

export async function getSettings(): Promise<Record<string, string>> {
  const res = await apiGet<SettingsResponse>('/settings')
  return res.settings
}

export async function updateSetting(key: string, value: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>('/settings', { key, value })
}

export async function testLLMConnection(): Promise<{ connected: boolean; latency: number; model: string }> {
  return apiGet<{ success: boolean; connected: boolean; latency: number; model: string }>('/settings/test-llm')
}
