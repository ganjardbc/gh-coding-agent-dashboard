# PROMPT — FRONTEND Github Integrations

You are a senior frontend engineer and product-minded fullstack engineer.

I have a separate frontend repository for an internal operator dashboard.
This dashboard connects to a backend called "gh-coding-agent" over HTTP API.

The backend is being upgraded with a **GitHub Integration MVP**.
Your task is to update / extend the dashboard so it can operate GitHub-aware jobs cleanly.

IMPORTANT:
This repository is frontend-only.
Do NOT place backend code here.
Do NOT redesign the backend.
Build the UI around the backend API.

---

# SYSTEM CONTEXT

There are two separate repositories:

## Repo 1 — gh-coding-agent (backend)
Capabilities:
- coding agent backend
- queue + worker execution
- /runs JSON output
- jobs API
- GitHub Integration MVP being added

The backend will support jobs that can optionally include GitHub context such as:
- owner
- repo
- branch
- baseBranch
- issueNumber
- prNumber

The backend may also support webhook-triggered jobs and comment-back to GitHub.

## Repo 2 — dashboard (this repo)
Purpose:
- internal operator dashboard
- create and monitor jobs
- inspect runs
- inspect job metadata
- now also support GitHub-aware workflows

---

# GOAL

Upgrade the dashboard so it can operate both:
1. normal jobs
2. GitHub-aware jobs

The dashboard should let me:
- create a job manually with GitHub repository context
- see which jobs are linked to a repo / branch / issue / PR
- inspect GitHub metadata on job detail
- understand whether a job came from webhook or manual trigger
- inspect whether result feedback was sent back to GitHub
- replay GitHub-aware jobs

This should remain a clean internal operator tool, not a public-facing app.

---

# BACKEND API EXPECTATION

Assume the backend now supports or will support endpoints such as:

- POST /run
- GET /jobs
- GET /jobs/:id
- GET /runs
- GET /runs/:file
- GET /health
- POST /webhooks/github (backend only; frontend does not call this directly)
- possibly richer job responses that include GitHub metadata

A job may now look conceptually like this:

{
  "id": "job_123",
  "command": "undangabi",
  "prompt": "refactor auth module",
  "status": "completed",
  "runFile": "run-123.json",
  "github": {
    "owner": "ganjardbc",
    "repo": "undangabi-v2",
    "branch": "feature/auth-refactor",
    "baseBranch": "main",
    "issueNumber": 12,
    "prNumber": null
  },
  "source": {
    "type": "manual" or "github-webhook"
  },
  "githubFeedback": {
    "posted": true,
    "targetType": "issue",
    "targetNumber": 12,
    "commentUrl": "..."
  }
}

You must inspect the actual backend response shape in the repository or API contract and adapt the UI to it.

---

# FRONTEND GOAL FOR THIS PHASE

This phase is NOT about fancy design.
It is about making the dashboard understand and operate GitHub-aware jobs.

Think of this as:
“dashboard v2 = agent operations + GitHub context visibility”

---

# REQUIRED UI CHANGES / FEATURES

Implement the following capabilities.

---

# 1) New Task page must support GitHub context

Extend the existing “New Task” UI so a manual job can optionally include GitHub repository context.

The form should support:
- command
- prompt
- optional GitHub section toggle or expandable panel
- if GitHub section enabled, allow entering:
  - owner
  - repo
  - branch
  - baseBranch (optional)
  - issueNumber (optional)
  - prNumber (optional)

Requirements:
- the form should still work for non-GitHub jobs
- GitHub fields should be grouped clearly and not clutter the form
- the payload sent to the backend must match the backend GitHub-aware /run contract
- after submit, show the created job and redirect or link to job detail

Optional nice-to-have:
- preset templates for common flows like “issue-linked job” or “PR-linked job”
Only include if it stays simple.

---

# 2) Jobs list must show GitHub context summary

Update the jobs list page so I can quickly see which jobs are linked to GitHub.

For each job row, show GitHub summary if present, for example:
- owner/repo
- branch
- issue # or PR #
- source badge: manual vs webhook

This should be compact and scan-friendly.

The jobs list should still show the normal operational fields:
- job id
- command
- prompt preview
- status
- timestamps
- run file if available

Add filter options if practical:
- all jobs
- only GitHub-linked jobs
- only webhook-triggered jobs
- filter by status

Do not overbuild the filtering UI, but make it useful.

---

# 3) Job detail page must expose GitHub metadata clearly

This is one of the most important changes.

The job detail page should now include dedicated sections for:

## A. Job core info
- job id
- command
- prompt
- status
- timestamps
- run file
- stdout/stderr preview if available

## B. GitHub context
If the job includes GitHub metadata, show:
- owner/repo
- branch
- base branch
- issue number
- PR number
- source type (manual / webhook)
- triggering event type if available

## C. GitHub feedback result
If the backend exposes feedback info, show:
- whether a comment was posted back to GitHub
- target type (issue / PR)
- target number
- comment URL if available

## D. Replay action
Replay should preserve the GitHub metadata when appropriate and prefill the new task form.

This page should become the main operational debugging page for GitHub-aware jobs.

---

# 4) Runs view should reflect GitHub linkage if available

If a run is linked to a GitHub-aware job, show that relationship in the run view if the backend data makes it possible.

At minimum:
- if run detail is opened via job detail, the GitHub context should remain visible nearby
- if runs list includes metadata summaries, show GitHub repo/branch info when available

Do not force a complicated run explorer.
Just make the GitHub relationship visible enough.

---

# 5) Dashboard overview should include GitHub-aware summaries

Update the overview / dashboard home to include operational visibility for GitHub jobs.

Examples of useful summary widgets:
- total jobs
- running jobs
- failed jobs
- GitHub-linked jobs count
- webhook-triggered jobs count
- recent GitHub jobs

Only include what can be derived cleanly from the available backend data.

Do not make the page noisy.

---

# 6) Status / source / GitHub badges

Add a consistent badge system for:
- job status (queued / running / completed / failed)
- source type (manual / webhook)
- GitHub linkage (repo-linked, issue-linked, PR-linked if useful)

Keep badges simple and readable.

---

# 7) Service layer and types update

Refactor the frontend service layer and types so GitHub-aware jobs are first-class in the UI model.

Expected frontend type areas:
- Job
- GitHubJobContext
- JobSource
- GitHubFeedback
- Run summary / run detail

Update the API service layer so it can:
- submit a GitHub-aware job payload
- parse richer job metadata from backend responses
- preserve compatibility with non-GitHub jobs

Do not let GitHub fields leak chaotically across the UI.
Keep a clean model.

---

# 8) Polling / refresh behavior

Jobs still move through queue states.

The polling / refresh strategy should continue to work, but now job detail and jobs list should reflect GitHub-related updates too, such as:
- status changes
- run file link becoming available
- githubFeedback being populated after completion

Use a pragmatic polling strategy.
Do NOT add websockets unless absolutely necessary.

---

# 9) Repo architecture expectations

This repo is a separate frontend app.
Please inspect the current stack first and adapt the implementation to it.

If the repo already uses Nuxt / Vue / Vite / Pinia / Tailwind / TypeScript, work with the existing choices instead of forcing a migration.

Maintain a clean structure with clear boundaries such as:
- pages / routes
- components
- composables
- services
- types

---

# IMPLEMENTATION ORDER

Work in this order:

## Phase 1 — Inspect this dashboard repository
Identify:
- current frontend stack
- current routing setup
- current pages for jobs / runs / new task
- current API service layer
- what can be reused vs what must be extended

## Phase 2 — Propose the GitHub-aware UI architecture
Before editing files, clearly show:
1. route/page changes
2. component changes
3. type model changes
4. service layer changes
5. how GitHub metadata will appear in the UI
6. polling/refresh impact

## Phase 3 — Implement the dashboard upgrade
Create / refactor the necessary pages, components, composables, services, and types.

## Phase 4 — Explain how to run and verify
Provide:
- env vars needed for API base URL
- dev/build commands
- how to manually create a GitHub-aware job from the UI
- how to verify GitHub-linked jobs appear correctly
- how replay preserves GitHub metadata

---

# OUTPUT FORMAT I WANT

Return the result in this structure:

1. Frontend stack choice / existing stack assessment
2. GitHub-aware dashboard architecture summary
3. Route and page updates
4. Type model changes
5. Service layer changes
6. Components / pages created or updated
7. How GitHub metadata is shown in the UI
8. Polling / refresh behavior
9. Environment variables needed
10. How to run locally
11. How to test against the backend
12. What should be the next phase after this dashboard update

---

# IMPORTANT IMPLEMENTATION PREFERENCES

- Keep the UI thin and operational
- Do not overdesign the interface
- Preserve support for non-GitHub jobs
- Make GitHub-aware jobs easy to inspect and replay
- Respect the separate backend/frontend repo architecture
- Make this easy to extend later for:
  - planner / executor / reviewer multi-agent visualization
  - PR review flows
  - repo/workspace management
  - artifact timeline and execution graph

Now inspect this dashboard repository and implement the GitHub-aware dashboard upgrade accordingly.