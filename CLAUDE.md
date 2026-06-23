# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install      # install deps
pnpm dev          # dev server at localhost:5173
pnpm build        # type-check + build (vue-tsc --noEmit && vite build)
pnpm preview      # preview production build
```

No test framework is configured. Type-check via `pnpm build` (vue-tsc runs first).

## Environment

Copy `.env.example` → `.env.local` and set `VITE_API_BASE_URL` to the backend origin:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Architecture

Operator dashboard for [gh-coding-agent](https://github.com/ganjarhadiatna/gh-coding-agent) — a queue-based AI coding agent backend. No global state (no Pinia); all state is local to composables.

### Data flow

```
api-client (fetch wrapper)
  └── *-service (typed API calls + response unwrapping)
        └── composable (reactive state + fetch logic)
              └── page component
```

- `src/services/api-client.ts` — single `request<T>()` with `apiGet`/`apiPost` exports. Base URL from `VITE_API_BASE_URL`.
- `src/services/` — one file per domain (`jobs-service`, `runs-service`, `health-service`). Each unwraps the `{ success, data }` envelope the backend returns.
- `src/composables/` — `useJobs`, `useJobDetail`, `useRuns`, `useHealth`, `useRunTask`. Return reactive refs + async fetch functions.
- `src/pages/` — route-level views. Call composables, compose components.
- `src/components/` — split by domain: `dashboard/`, `jobs/`, `runs/`, `shared/`.
- `src/types/` — shared TS interfaces: `job.ts`, `run.ts`, `health.ts`.

### Polling strategy

`useJobDetail` polls every 3 s while `job.status` is `queued` or `running`, stops automatically on terminal status or component unmount. Dashboard page polls jobs list for the same condition.

### Backend API surface

| Method | Path | Used by |
|---|---|---|
| POST | `/run` | `createJob` |
| POST | `/validate` | `validateTask` |
| GET | `/jobs` | `getJobs` |
| GET | `/jobs/:id` | `getJobById` |
| GET | `/runs` | `getRuns` |
| GET | `/runs/:file` | `getRunByFile` |
| GET | `/health` | `getHealth` |
| GET | `/queue/health` | `getQueueHealth` |
| GET | `/repos` | `getRepos` (health-service) |

### Route map

| Path | Page |
|---|---|
| `/` | DashboardPage — stats cards, health, recent jobs |
| `/new-task` | NewTaskPage — submit/validate task form |
| `/jobs` | JobsPage — filterable job list |
| `/jobs/:id` | JobDetailPage — detail + replay action |
| `/runs` | RunsPage — browse run files |
| `/runs/:file` | RunDetailPage — structured viewer + raw JSON |

`App.vue` wraps `RouterView` in `AppLayout` (shared sidebar/header).

### Key type notes

- `JobStatus`: `'pending' | 'queued' | 'running' | 'success' | 'failed'`
- `JobDetail` extends `JobSummary` with `plan`, `result`, `validationOutput`, `observabilityLogs`
- `RunData` mirrors the run JSON structure stored in `/runs/*.json` on the backend
- `CreateJobResult` is the normalized shape from both `/run` and `/validate` responses
