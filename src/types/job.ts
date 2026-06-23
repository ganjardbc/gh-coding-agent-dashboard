export type JobStatus = 'pending' | 'queued' | 'running' | 'success' | 'failed'

export interface JobInput {
  repo: string
  task: string
  validate: boolean
}

export interface JobSummary {
  id: string
  jobId: string | null
  status: JobStatus
  input: JobInput
  createdAt: string | null
  startedAt: string | null
  finishedAt: string | null
  error: string | null
  github?: import('./github').GitHubJobContext
  source?: import('./github').JobSource
  githubFeedback?: import('./github').GitHubFeedback
}

export interface CommandResult {
  command: string
  exitCode: number
  stdout: string
  stderr: string
}

export interface PlanResult {
  summary: string
  filesToInspect: string[]
  implementationSteps: string[]
  validationSteps: string[]
  risks: string[]
}

export interface ValidationOutput {
  status: 'success' | 'failed'
  reason: string
  quality_score: number
  suggested_fix?: string
  retry_strategy: string
}

export interface ObservabilityLog {
  agent: string
  input: unknown
  output: unknown
  latency: number
  confidence?: number
  timestamp: string
}

export interface JobDetail extends JobSummary {
  plan?: PlanResult
  result?: {
    repoPath: string
    inspection?: unknown
    commandResults: CommandResult[]
  }
  validationOutput?: ValidationOutput
  observabilityLogs?: ObservabilityLog[]
  retryCount?: number
  validation?: unknown
}

export interface CreateJobResult {
  runId: string
  jobId: string
  status: string
  queuedAt: string
}
