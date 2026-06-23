# PROMPT — BUILD OPERATOR DASHBOARD

You are a senior frontend engineer and product-minded fullstack engineer.

I have an existing project called "gh-coding-agent".

The project has already been upgraded from a pure CLI tool into a production-oriented backend architecture with:
- Express API
- queue-based execution (jobs)
- worker process
- existing CLI agent kept as execution engine
- run files stored in /runs/*.json
- job status tracking such as queued / running / completed / failed

Your task now is to build the NEXT STEP:

# GOAL
Create a minimal but solid **operator dashboard UI** for this system so I can use the agent comfortably without relying on SSH / CLI.

This dashboard is NOT a marketing landing page.
This is an **internal operations interface** for running and monitoring the coding agent.

---

# PRODUCT GOAL OF THIS UI

The UI should let me do 5 core things:

1. submit a new agent task
2. see all jobs and their status
3. inspect a single job in detail
4. inspect related run output / run JSON
5. replay a previous task with modified input

This should feel like a clean internal tool / control panel for an AI execution backend.

---

# IMPORTANT CONTEXT

The backend already exists or is being upgraded to include endpoints similar to:

- POST /run
- POST /validate
- GET /jobs
- GET /jobs/:id
- GET /runs
- GET /runs/:file
- GET /health
- GET /queue/health (optional)

The UI must consume this backend.
Do NOT redesign the backend unless you find a critical mismatch. If there is a mismatch, adapt the UI to the current backend shape and clearly explain it.

---

# FRONTEND STACK REQUIREMENT

Use a Vue-based stack, preferably aligned with a modern frontend architecture.

Preferred direction:
- Nuxt 3 if it fits cleanly
OR
- Vue 3 + Vite if you think it is more appropriate for an internal dashboard

Choose the option that best fits this use case and explain the reason briefly.

Use:
- Vue 3 Composition API
- TypeScript if the repo is already TypeScript-friendly
- clean component-based structure
- simple styling approach (Tailwind is acceptable if already present / easy to add, otherwise keep styling pragmatic and clean)

Do NOT overengineer the UI.

---

# DASHBOARD SCOPE (MVP)

Build the following screens / sections:

## 1) Dashboard Home
Purpose:
- quick operational overview

Show:
- summary cards:
  - total jobs
  - queued jobs
  - running jobs
  - completed jobs
  - failed jobs
- backend health status
- queue / worker health if endpoint exists
- latest recent jobs

This page should answer:
“What is happening in my agent system right now?”

---

## 2) New Task Page / Panel
Purpose:
- submit a new task to the agent

Form fields:
- command (string)
- prompt / task input (textarea)
- optional mode selector if backend supports it (e.g. normal / validate)
- optional metadata if useful, but keep MVP simple

Actions:
- Run task
- Validate task (if backend supports validation)

After submission:
- show returned job ID
- show current status
- optionally navigate to job detail page

This page is one of the most important parts of the app.

---

## 3) Jobs List Page
Purpose:
- list all queued / running / completed / failed jobs

Table / list should show:
- job id
- command
- short prompt preview
- status
- created time
- started / completed time if available
- linked run file if available

Required features:
- status badge
- basic filtering by status
- sorting by latest first
- click row → open job detail

Do NOT make it fancy.
Make it useful.

---

## 4) Job Detail Page
Purpose:
- inspect a single job deeply

Show:
- job metadata
- command
- prompt
- status
- timestamps
- linked run file
- error message if failed
- stdout / stderr preview if backend exposes it
- a “Replay” action that pre-fills the task form using this job’s input

If a run file exists, show a clear section linking to / displaying run details.

This page should become the main debugging surface.

---

## 5) Runs List / Run Detail
You can implement this either as:
- a dedicated runs page + run detail page
OR
- embed run viewing directly into the job detail page if that gives a cleaner UX

But I must be able to:
- browse run files
- open a run
- inspect its JSON or a human-readable summary

For run detail, prioritize readability.
Do not just dump ugly raw JSON if you can provide a better structured viewer.

---

# UX REQUIREMENTS

This is an internal tool, so UX should be:
- clean
- fast
- operational
- low-friction
- easy to scan

Avoid flashy design.
Think “control panel for an AI worker system”.

Must-have UX details:
- clear status badges (queued / running / completed / failed)
- loading states
- empty states
- error states
- success feedback after submitting a job
- sensible layout for desktop first
- responsive enough for laptop / tablet, but desktop experience is priority

---

# DATA / STATE REQUIREMENTS

Implement clean data fetching and mutation flow.

Preferred approach:
- a service layer for API calls
- composables / stores for job-related logic if appropriate
- clear separation between:
  - API client
  - page-level data fetching
  - presentational components

If using Nuxt:
- use composables and/or Pinia if needed, but do not force global state for everything
If using Vite Vue:
- use a lightweight store strategy if necessary

Keep it understandable for a solo builder.

---

# RECOMMENDED INFORMATION ARCHITECTURE

Please design the app with a structure roughly like this (adapt if needed):

apps/dashboard/
  pages/
    index
    jobs/index
    jobs/[id]
    new-task
    runs/index
    runs/[id]
  components/
    dashboard/
    jobs/
    runs/
    shared/
  composables/
    useJobs
    useRuns
    useHealth
    useRunTask
  services/
    api-client
    jobs-service
    runs-service
    health-service
  types/
    job
    run
    health

If you choose Nuxt, adapt to Nuxt conventions.
If you choose Vue + Vite, adapt accordingly.
But keep the same responsibility boundaries.

---

# DESIGN / UI REQUIREMENTS

Visual direction:
- minimal, modern, technical
- feels like a builder / ops dashboard
- not corporate boring, but also not flashy

Use a layout with:
- top header
- left sidebar or compact navigation if useful
- main content area

Suggested nav:
- Overview
- New Task
- Jobs
- Runs

Optional:
- Health / System

Use cards, tables, and detail panels.

---

# API INTEGRATION EXPECTATIONS

The UI must integrate with the real backend shape.

Please inspect the current backend endpoints and create a typed service layer that maps backend responses cleanly into frontend-friendly types.

Examples of service responsibilities:
- createJob(payload)
- validateTask(payload)
- getJobs(params?)
- getJobById(id)
- getRuns()
- getRunByFile(file)
- getHealth()
- getQueueHealth()

If some backend endpoints are missing or named differently, adapt and document it clearly.

---

# MVP FEATURE DETAILS

## A. New Task flow
- submit task
- optimistic or immediate feedback
- show created job result
- redirect to job detail or offer “view job”

## B. Replay flow
From a job detail page:
- click replay
- open task form with previous command + prompt prefilled
- allow editing before re-submit

## C. Run viewer
For a run JSON, present:
- top-level metadata
- status / summary if present
- steps or sections if present
- raw JSON collapse section if useful

## D. Refresh strategy
Since jobs can move from queued → running → completed, implement a practical refresh strategy.

Acceptable approaches:
- manual refresh button
- lightweight polling on job detail / jobs page
- smart polling only for running jobs

Do NOT overbuild websockets unless truly necessary.
Prefer a pragmatic polling-based MVP.

---

# WHAT I WANT YOU TO DO FIRST

Before coding, do this in order:

## Phase 1 — Inspect the repository
- identify where the backend lives
- identify if there is already a frontend app or monorepo structure
- inspect API endpoint shapes
- inspect whether the project already uses Nuxt / Vue / Vite / Tailwind / TS

## Phase 2 — Propose the UI architecture
Before creating files, show:
1. chosen frontend stack and why
2. folder structure
3. route map
4. shared types and service layer design
5. polling / refresh strategy

## Phase 3 — Implement the dashboard
Create the pages, components, composables, and services needed for the MVP dashboard.

## Phase 4 — Explain how to run it
Provide:
- install commands
- dev command
- production build command
- how to point the dashboard to the API base URL
- any environment variables needed

---

# OUTPUT FORMAT I WANT

Return the result in this structure:

1. **Frontend stack choice**
2. **Dashboard architecture summary**
3. **Folder structure tree**
4. **Pages and responsibilities**
5. **Service layer design**
6. **Files created / changed**
7. **How polling / refresh works**
8. **How to run locally**
9. **How to connect it to the VPS backend**
10. **What should be the next phase after this dashboard**

---

# IMPORTANT CONSTRAINTS

- Keep the UI thin and practical
- Do not turn this into a huge product UI
- Focus on operating the agent backend
- Respect the existing backend and CLI architecture
- Make the code easy to extend later into:
  - multi-agent views
  - timeline / execution graph
  - GitHub-triggered jobs
  - per-project workspaces

Now inspect the repository and implement the dashboard MVP accordingly.