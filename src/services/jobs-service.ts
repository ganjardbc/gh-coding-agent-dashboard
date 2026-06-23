import { apiGet, apiPost } from './api-client'
import type { JobSummary, JobDetail, CreateJobResult } from '@/types/job'

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

export async function createJob(repo: string, task: string): Promise<CreateJobResult> {
  const res = await apiPost<CreateJobResponse>('/run', { repo, task })
  return { runId: res.runId, jobId: res.jobId, status: res.status, queuedAt: res.queuedAt }
}

export async function validateTask(repo: string, task: string): Promise<CreateJobResult> {
  const res = await apiPost<CreateJobResponse>('/validate', { repo, task })
  return { runId: res.runId, jobId: res.jobId, status: res.status, queuedAt: res.queuedAt }
}
