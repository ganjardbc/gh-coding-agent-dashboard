export interface RunData {
  id: string
  status: string
  input: {
    repo: string
    task: string
    validate: boolean
  }
  plan?: {
    summary: string
    filesToInspect: string[]
    implementationSteps: string[]
    validationSteps: string[]
    risks: string[]
  }
  result?: {
    repoPath: string
    commandResults: Array<{
      command: string
      exitCode: number
      stdout: string
      stderr: string
    }>
  }
  validationOutput?: {
    status: string
    reason: string
    quality_score: number
    suggested_fix?: string
    retry_strategy?: string
  }
  observabilityLogs?: Array<{
    agent: string
    latency: number
    confidence?: number
    timestamp: string
    input?: unknown
    output?: unknown
  }>
  createdAt?: string
  startedAt?: string
  finishedAt?: string
  jobId?: string
  error?: string
  retryCount?: number
}
