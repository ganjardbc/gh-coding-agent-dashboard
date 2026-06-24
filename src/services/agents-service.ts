import { apiGet } from './api-client'

export interface AgentMetadata {
  id: string
  name: string
  role: string
  description: string
  filePath: string
  modelType: string
  capabilities: string[]
  icon: string
}

export interface AgentsResponse {
  success: boolean
  agents: AgentMetadata[]
}

export async function getAgents(): Promise<AgentMetadata[]> {
  const res = await apiGet<AgentsResponse>('/agents')
  return res.agents
}
