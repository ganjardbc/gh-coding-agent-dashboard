import { apiGet } from './api-client'
import type { RunData } from '@/types/run'

interface RunsResponse {
  success: boolean
  runs: string[]
}

interface RunResponse {
  success: boolean
  run: RunData
}

export async function getRuns(): Promise<string[]> {
  const res = await apiGet<RunsResponse>('/runs')
  return res.runs
}

export async function getRunByFile(file: string): Promise<RunData> {
  const res = await apiGet<RunResponse>(`/runs/${file}`)
  return res.run
}
