import { apiGet, apiPost } from './api-client'
import type { JobSummary, JobDetail, CreateJobResult, RetryJobResult } from '@/types/job'
import type { GitHubJobContext } from '@/types/github'

interface JobsResponse {
  success: boolean
  jobs: JobSummary[]
  total: number
}

interface JobDetailResponse {
  success: boolean
  job: JobDetail
}

interface CreateJobResponse {
  success: boolean
  runId: string
  jobId: string
  status: string
  queuedAt: string
}

export async function getJobs(): Promise<JobSummary[]> {
  const res = await apiGet<JobsResponse>('/jobs')
  return res.jobs
}

export async function getJobById(id: string): Promise<JobDetail> {
  const res = await apiGet<JobDetailResponse>(`/jobs/${id}`)
  return res.job
}

export async function createJob(repo: string, task: string, github?: GitHubJobContext): Promise<CreateJobResult> {
  const body: Record<string, unknown> = { repo, task }
  if (github) body.github = github
  const res = await apiPost<CreateJobResponse>('/run', body)
  return { runId: res.runId, jobId: res.jobId, status: res.status, queuedAt: res.queuedAt }
}

export async function validateTask(repo: string, task: string, github?: GitHubJobContext): Promise<CreateJobResult> {
  const body: Record<string, unknown> = { repo, task }
  if (github) body.github = github
  const res = await apiPost<CreateJobResponse>('/validate', body)
  return { runId: res.runId, jobId: res.jobId, status: res.status, queuedAt: res.queuedAt }
}

interface RetryJobResponse {
  success: boolean
  runId: string
  jobId: string
  originalRunId: string
  status: string
  queuedAt: string
}

export async function retryJob(id: string): Promise<RetryJobResult> {
  const res = await apiPost<RetryJobResponse>(`/jobs/${id}/retry`, {})
  return {
    runId: res.runId,
    jobId: res.jobId,
    originalRunId: res.originalRunId,
    status: res.status,
    queuedAt: res.queuedAt,
  }
}
