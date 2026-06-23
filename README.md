# gh-coding-agent-dashboard

Operator dashboard UI for [gh-coding-agent](https://github.com/ganjarhadiatna/gh-coding-agent) — a queue-based AI coding agent backend.

Built for internal ops use: submit tasks, monitor jobs, inspect run output — without SSH or CLI.

---

## Stack

- **Vue 3** + Vite + TypeScript
- **Vue Router** (client-side routing)
- **Tailwind CSS**
- Composition API + composables (no Pinia — local state only)

---

## Features

| Page | Purpose |
|---|---|
| `/` | Dashboard overview — job stats, health status, recent jobs |
| `/new-task` | Submit or validate a new agent task |
| `/jobs` | All jobs with status filter, sorted latest-first |
| `/jobs/:id` | Job detail — metadata, output, replay action |
| `/runs` | Browse run files |
| `/runs/:file` | Run detail — structured viewer + raw JSON |

**Refresh strategy**: lightweight polling on job detail and dashboard pages (active jobs only). Manual refresh available everywhere.

---

## Setup

```bash
pnpm install
```

### Environment

Copy `.env.example` and point at your backend:

```bash
cp .env.example .env.local
```

```env
VITE_API_BASE_URL=http://localhost:3000
```

For a remote VPS backend:

```env
VITE_API_BASE_URL=https://your-vps-host:3000
```

### Dev

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

---

## Backend API

Expects a running [gh-coding-agent](https://github.com/ganjarhadiatna/gh-coding-agent) backend with these endpoints:

```
POST /run
POST /validate
GET  /jobs
GET  /jobs/:id
GET  /runs
GET  /runs/:file
GET  /health
GET  /queue/health   (optional)
```

---

## Project Structure

```
src/
├── pages/           # Route-level views
├── components/
│   ├── dashboard/   # Stats cards, health, recent jobs
│   ├── jobs/        # Jobs table
│   ├── runs/        # Run viewer
│   └── shared/      # Layout, badges, loading/error/empty states
├── composables/     # useJobs, useRuns, useHealth, useRunTask
├── services/        # api-client, jobs/runs/health services
└── types/           # job, run, health types
```
