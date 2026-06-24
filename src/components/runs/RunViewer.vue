<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import type { RunData } from '@/types/run'

const props = defineProps<{ run: RunData }>()

const showRawJson = ref(false)
const expandedCmd = ref<number | null>(null)
const expandedLog = ref<number | null>(null)

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtTime(ts: string | undefined | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtDate(ts: string | undefined | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtLatency(ms: number): string {
  return ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : ms + 'ms'
}

function formatJson(val: unknown): string {
  try { return JSON.stringify(val, null, 2) } catch { return String(val) }
}

function toggleCmd(idx: number) {
  expandedCmd.value = expandedCmd.value === idx ? null : idx
}

// ── Status trail ──────────────────────────────────────────────────────────────

interface StatusStep {
  key: string
  label: string
  icon: string
  time?: string
  reached: boolean
  isCurrent: boolean
  isError: boolean
}

const statusSteps = computed((): StatusStep[] => {
  const s = props.run.status
  const done = s === 'success' || s === 'failed'
  const running = done || s === 'running'
  const queued = running || s === 'queued'

  return [
    {
      key: 'created',
      label: 'Created',
      icon: 'lucide:plus-circle',
      time: fmtTime(props.run.createdAt),
      reached: true,
      isCurrent: s === 'pending',
      isError: false,
    },
    {
      key: 'queued',
      label: 'Queued',
      icon: 'lucide:clock',
      time: props.run.jobId ? fmtTime(props.run.createdAt) : undefined,
      reached: queued,
      isCurrent: s === 'queued',
      isError: false,
    },
    {
      key: 'running',
      label: 'Running',
      icon: 'lucide:loader-2',
      time: fmtTime(props.run.startedAt),
      reached: running,
      isCurrent: s === 'running',
      isError: false,
    },
    {
      key: 'done',
      label: s === 'success' ? 'Success' : s === 'failed' ? 'Failed' : 'Finished',
      icon: s === 'success' ? 'lucide:check-circle-2' : s === 'failed' ? 'lucide:x-circle' : 'lucide:circle',
      time: fmtTime(props.run.finishedAt),
      reached: done,
      isCurrent: done,
      isError: s === 'failed',
    },
  ]
})

// ── Agent trace ───────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, string> = {
  inspector:        'lucide:search-code',
  'planner-a':      'lucide:clipboard-list',
  'planner-b':      'lucide:git-compare',
  coder:            'lucide:code-2',
  reviewer:         'lucide:eye',
  'test-generator': 'lucide:flask-conical',
  executor:         'lucide:terminal',
  validator:        'lucide:shield-check',
  debugger:         'lucide:bug',
}

const AGENT_COLORS: Record<string, { icon: string; badge: string; dot: string }> = {
  inspector:        { icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',   dot: 'bg-indigo-500' },
  'planner-a':      { icon: 'text-blue-600',   badge: 'bg-blue-50 text-blue-700 border-blue-100',         dot: 'bg-blue-500'   },
  'planner-b':      { icon: 'text-sky-600',    badge: 'bg-sky-50 text-sky-700 border-sky-100',            dot: 'bg-sky-500'    },
  coder:            { icon: 'text-violet-600', badge: 'bg-violet-50 text-violet-700 border-violet-100',   dot: 'bg-violet-500' },
  reviewer:         { icon: 'text-amber-600',  badge: 'bg-amber-50 text-amber-700 border-amber-100',      dot: 'bg-amber-500'  },
  'test-generator': { icon: 'text-emerald-600',badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',dot: 'bg-emerald-500'},
  executor:         { icon: 'text-slate-500',  badge: 'bg-slate-50 text-slate-600 border-slate-100',      dot: 'bg-slate-400'  },
  validator:        { icon: 'text-teal-600',   badge: 'bg-teal-50 text-teal-700 border-teal-100',         dot: 'bg-teal-500'   },
  debugger:         { icon: 'text-red-600',    badge: 'bg-red-50 text-red-700 border-red-100',            dot: 'bg-red-500'    },
}

const DEFAULT_AGENT_COLOR = { icon: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border-slate-100', dot: 'bg-slate-400' }

function agentColor(name: string) { return AGENT_COLORS[name] ?? DEFAULT_AGENT_COLOR }
function agentIcon(name: string) { return AGENT_ICONS[name] ?? 'lucide:bot' }

const logs = computed(() => props.run.observabilityLogs ?? [])
const totalLatencyMs = computed(() => logs.value.reduce((s, l) => s + l.latency, 0))
const maxLatency = computed(() => Math.max(...logs.value.map((l) => l.latency), 1))

function latencyPct(ms: number) { return Math.round((ms / maxLatency.value) * 100) }

function confidenceBadge(v: number): string {
  if (v >= 0.85) return 'bg-emerald-50 text-emerald-700 border-emerald-100'
  if (v >= 0.65) return 'bg-amber-50 text-amber-700 border-amber-100'
  return 'bg-red-50 text-red-700 border-red-100'
}
</script>

<template>
  <div class="space-y-4">

    <!-- ── Status Trail ─────────────────────────────────────────────────────── -->
    <div class="bg-white border border-slate-200 rounded-xl p-5">
      <div class="flex items-start gap-0">
        <template v-for="(step, i) in statusSteps" :key="step.key">
          <!-- Step -->
          <div class="flex flex-col items-center flex-1 min-w-0">
            <!-- Circle -->
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors',
                step.reached && step.isError
                  ? 'bg-red-500 border-red-500 text-white'
                  : step.reached && step.isCurrent && !step.isError
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : step.reached
                  ? 'bg-slate-800 border-slate-800 text-white'
                  : 'bg-white border-slate-300 text-slate-300'
              ]"
            >
              <Icon :icon="step.icon" class="w-3.5 h-3.5" />
            </div>
            <!-- Label + time -->
            <div class="mt-1.5 text-center px-1">
              <div
                :class="[
                  'text-[11px] font-semibold',
                  step.reached && step.isError ? 'text-red-600'
                  : step.reached ? 'text-slate-700'
                  : 'text-slate-400'
                ]"
              >{{ step.label }}</div>
              <div v-if="step.time && step.reached" class="text-[10px] text-slate-400 font-mono mt-0.5">{{ step.time }}</div>
            </div>
          </div>

          <!-- Connector line (not after last) -->
          <div
            v-if="i < statusSteps.length - 1"
            class="flex-shrink-0 w-6 mt-4"
          >
            <div
              :class="[
                'h-px w-full',
                statusSteps[i + 1].reached
                  ? 'border-t-2 border-slate-800'
                  : 'border-t-2 border-dashed border-slate-300'
              ]"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- ── Task info ────────────────────────────────────────────────────────── -->
    <div class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1 min-w-0">
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ run.input.task }}</p>
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <span class="font-mono text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{{ run.input.repo }}</span>
            <span v-if="run.input.validate" class="text-[11px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded">validate</span>
            <span v-if="run.retryCount" class="text-[11px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded">{{ run.retryCount }} retr{{ run.retryCount === 1 ? 'y' : 'ies' }}</span>
          </div>
        </div>
        <StatusBadge :status="run.status" class="flex-shrink-0" />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Run ID</div>
          <div class="font-mono text-[11px] text-slate-600 truncate">{{ run.id }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Date</div>
          <div class="text-[11px] text-slate-600">{{ fmtDate(run.createdAt) }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Started</div>
          <div class="font-mono text-[11px] text-slate-600">{{ fmtTime(run.startedAt) }}</div>
        </div>
        <div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Finished</div>
          <div class="font-mono text-[11px] text-slate-600">{{ fmtTime(run.finishedAt) }}</div>
        </div>
      </div>

      <div v-if="run.error" class="p-3 bg-red-50 border border-red-100 rounded-lg">
        <div class="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">Error</div>
        <pre class="text-xs text-red-700 font-mono whitespace-pre-wrap">{{ run.error }}</pre>
      </div>
    </div>

    <!-- ── Agent Trace ──────────────────────────────────────────────────────── -->
    <div v-if="logs.length" class="bg-white border border-slate-200 rounded-xl p-5">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:git-commit-horizontal" class="w-4 h-4 text-slate-400" />
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent Trace</h3>
          <span class="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{{ logs.length }} agents · {{ fmtLatency(totalLatencyMs) }} total</span>
        </div>
      </div>

      <!-- Cards with dashed connector -->
      <div>
        <div
          v-for="(log, i) in logs"
          :key="i"
          class="flex gap-3"
        >
          <!-- Left gutter: dot + dashed line below -->
          <div class="flex flex-col items-center flex-shrink-0 w-6">
            <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0 mt-3.5', agentColor(log.agent).dot]" />
            <div
              v-if="i < logs.length - 1"
              class="flex-1 border-l-2 border-dashed border-slate-200 mt-1 mb-0"
              style="min-height: 16px;"
            />
          </div>

          <!-- Card -->
          <div
            :class="['flex-1 min-w-0 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors', i < logs.length - 1 ? 'mb-2' : '']"
          >
            <!-- Top row -->
            <div class="flex items-center justify-between gap-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <Icon :icon="agentIcon(log.agent)" :class="['w-3.5 h-3.5 flex-shrink-0', agentColor(log.agent).icon]" />
                <span class="text-xs font-semibold text-slate-700 font-mono">{{ log.agent }}</span>
                <span
                  v-if="log.confidence !== undefined"
                  :class="['text-[10px] px-1.5 py-0.5 rounded border font-mono', confidenceBadge(log.confidence)]"
                >{{ Math.round(log.confidence * 100) }}%</span>
              </div>
              <span class="text-[11px] font-mono font-semibold text-slate-500 flex-shrink-0">{{ fmtLatency(log.latency) }}</span>
            </div>

            <!-- Latency bar -->
            <div class="h-1 bg-slate-100 rounded-full overflow-hidden mb-2.5">
              <div
                :class="['h-full rounded-full', agentColor(log.agent).dot]"
                :style="{ width: latencyPct(log.latency) + '%' }"
              />
            </div>

            <!-- Expandable I/O -->
            <div v-if="log.input !== undefined || log.output !== undefined">
              <button
                class="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                @click="expandedLog = expandedLog === i ? null : i"
              >
                <Icon :icon="expandedLog === i ? 'lucide:chevron-down' : 'lucide:chevron-right'" class="w-3 h-3" />
                {{ expandedLog === i ? 'Hide' : 'Show' }} input / output
              </button>
              <div v-if="expandedLog === i" class="mt-2 space-y-2">
                <div v-if="log.input !== undefined">
                  <div class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Input</div>
                  <pre class="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded p-2 overflow-x-auto max-h-36 whitespace-pre-wrap">{{ formatJson(log.input) }}</pre>
                </div>
                <div v-if="log.output !== undefined">
                  <div class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Output</div>
                  <pre class="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-100 rounded p-2 overflow-x-auto max-h-36 whitespace-pre-wrap">{{ formatJson(log.output) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Plan ────────────────────────────────────────────────────────────── -->
    <div v-if="run.plan" class="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</h3>
      <p class="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">{{ run.plan.summary }}</p>

      <div v-if="run.plan.implementationSteps?.length">
        <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Implementation steps</div>
        <ol class="space-y-1">
          <li
            v-for="(step, i) in run.plan.implementationSteps"
            :key="i"
            class="flex gap-2.5 text-xs text-slate-600"
          >
            <span class="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-mono font-semibold flex items-center justify-center">{{ i + 1 }}</span>
            <span class="pt-0.5">{{ step }}</span>
          </li>
        </ol>
      </div>

      <div v-if="run.plan.risks?.length">
        <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Risks</div>
        <ul class="space-y-1">
          <li
            v-for="(r, i) in run.plan.risks"
            :key="i"
            class="flex gap-2 text-xs text-red-600"
          >
            <Icon icon="lucide:alert-triangle" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {{ r }}
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Validation ───────────────────────────────────────────────────────── -->
    <div v-if="run.validationOutput" class="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validation</h3>
        <div class="flex items-center gap-2">
          <StatusBadge :status="run.validationOutput.status === 'success' ? 'success' : 'failed'" />
          <span class="text-xs font-mono text-slate-500">{{ run.validationOutput.quality_score }}/10</span>
        </div>
      </div>
      <p class="text-xs text-slate-600">{{ run.validationOutput.reason }}</p>
      <div v-if="run.validationOutput.suggested_fix" class="flex gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
        <Icon icon="lucide:lightbulb" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        {{ run.validationOutput.suggested_fix }}
      </div>
    </div>

    <!-- ── Execution ────────────────────────────────────────────────────────── -->
    <div v-if="run.result?.commandResults?.length" class="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <Icon icon="lucide:terminal" class="w-3.5 h-3.5 text-slate-400" />
        <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Execution</h3>
        <span class="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{{ run.result.commandResults.length }} commands</span>
      </div>
      <div class="divide-y divide-slate-100">
        <div v-for="(cmd, idx) in run.result.commandResults" :key="idx">
          <button
            class="w-full flex items-center justify-between px-5 py-2.5 hover:bg-slate-50 transition-colors text-left"
            @click="toggleCmd(idx)"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span :class="['w-2 h-2 rounded-full flex-shrink-0', cmd.exitCode === 0 ? 'bg-green-500' : 'bg-red-500']" />
              <code class="text-xs text-slate-700 truncate">{{ cmd.command }}</code>
            </div>
            <Icon :icon="expandedCmd === idx ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-2" />
          </button>
          <div v-if="expandedCmd === idx" class="px-5 pb-3 space-y-2">
            <div v-if="cmd.stdout">
              <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">stdout</div>
              <pre class="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap">{{ cmd.stdout }}</pre>
            </div>
            <div v-if="cmd.stderr">
              <div class="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">stderr</div>
              <pre class="text-xs text-red-700 bg-red-50 border border-red-100 rounded p-2 overflow-x-auto max-h-48 whitespace-pre-wrap">{{ cmd.stderr }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Raw JSON ─────────────────────────────────────────────────────────── -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        class="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left"
        @click="showRawJson = !showRawJson"
      >
        <div class="flex items-center gap-2">
          <Icon icon="lucide:braces" class="w-3.5 h-3.5 text-slate-400" />
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw JSON</span>
        </div>
        <Icon :icon="showRawJson ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-3.5 h-3.5 text-slate-400" />
      </button>
      <div v-if="showRawJson" class="px-5 pb-5 border-t border-slate-100">
        <pre class="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded p-3 overflow-x-auto max-h-96 whitespace-pre mt-3">{{ JSON.stringify(run, null, 2) }}</pre>
      </div>
    </div>

  </div>
</template>
