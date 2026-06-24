import { apiGet, apiPut, apiDelete } from './api-client'

export interface AgentToggleMap {
  inspector?: boolean
  plannerB?: boolean
  reviewer?: boolean
  testGenerator?: boolean
  debugger?: boolean
  executor?: boolean
  validator?: boolean
  forceComplexity?: 'low' | 'high' | null
}

export interface FlowConfigResponse {
  scope: string
  config: AgentToggleMap
  resolved?: AgentToggleMap
}

export interface WorkerHealthResponse {
  redis: 'ok' | 'error'
  redisError: string | null
  workerConfig: {
    concurrency: number
    lockDuration: number
  }
  queue: {
    waiting: number
    active: number
    failed: number
    delayed: number
  } | null
}

export async function getGlobalFlowConfig(): Promise<FlowConfigResponse> {
  return apiGet<FlowConfigResponse>('/config/flow')
}

export async function setGlobalFlowConfig(config: AgentToggleMap): Promise<void> {
  await apiPut('/config/flow', config)
}

export async function getScopeFlowConfig(scope: string): Promise<FlowConfigResponse> {
  return apiGet<FlowConfigResponse>(`/config/flow/${encodeURIComponent(scope)}`)
}

export async function setScopeFlowConfig(scope: string, config: AgentToggleMap): Promise<void> {
  await apiPut(`/config/flow/${encodeURIComponent(scope)}`, config)
}

export async function deleteScopeFlowConfig(scope: string): Promise<void> {
  await apiDelete(`/config/flow/${encodeURIComponent(scope)}`)
}

export async function getWorkerHealth(): Promise<WorkerHealthResponse> {
  return apiGet<WorkerHealthResponse>('/worker/health')
}
