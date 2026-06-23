export interface GitHubJobContext {
  owner: string
  repo: string
  branch?: string
  baseBranch?: string
  issueNumber?: number | null
  prNumber?: number | null
}

export type JobSourceType = 'manual' | 'github-webhook'

export interface JobSource {
  type: JobSourceType
  event?: string
}

export interface GitHubFeedback {
  posted: boolean
  targetType?: 'issue' | 'pr'
  targetNumber?: number
  commentUrl?: string
}
