<script setup lang="ts">
import { ref } from 'vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import type { RunData } from '@/types/run'

defineProps<{ run: RunData }>()

const showRawJson = ref(false)
const expandedCmd = ref<number | null>(null)

function fmtTime(ts: string | undefined | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function toggleCmd(idx: number) {
  expandedCmd.value = expandedCmd.value === idx ? null : idx
}
</script>

<template>
  <div class="space-y-4">
    <!-- Metadata -->
    <div class="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Metadata</h3>
      <dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt class="text-xs text-slate-400">ID</dt>
          <dd class="font-mono text-xs text-slate-700 break-all">{{ run.id }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Status</dt>
          <dd><StatusBadge :status="run.status" /></dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Repo</dt>
          <dd class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded inline-block">{{ run.input.repo }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Validate</dt>
          <dd class="text-xs text-slate-600">{{ run.input.validate ? 'yes' : 'no' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Created</dt>
          <dd class="text-xs text-slate-600 font-mono">{{ fmtTime(run.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-400">Finished</dt>
          <dd class="text-xs text-slate-600 font-mono">{{ fmtTime(run.finishedAt) }}</dd>
        </div>
        <div class="col-span-2">
          <dt class="text-xs text-slate-400 mb-0.5">Task</dt>
          <dd class="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 whitespace-pre-wrap">{{ run.input.task }}</dd>
        </div>
        <div v-if="run.error" class="col-span-2">
          <dt class="text-xs text-red-400 mb-0.5">Error</dt>
          <dd class="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 font-mono whitespace-pre-wrap">{{ run.error }}</dd>
        </div>
      </dl>
    </div>

    <!-- Plan -->
    <div v-if="run.plan" class="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan</h3>
      <div class="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-100">
        {{ run.plan.summary }}
      </div>
      <div v-if="run.plan.implementationSteps?.length" class="space-y-1">
        <div class="text-xs font-medium text-slate-500 mb-1">Steps</div>
        <ol class="space-y-1 text-xs text-slate-600 list-decimal list-inside">
          <li v-for="(step, i) in run.plan.implementationSteps" :key="i">{{ step }}</li>
        </ol>
      </div>
      <div v-if="run.plan.risks?.length" class="space-y-1">
        <div class="text-xs font-medium text-slate-500 mb-1">Risks</div>
        <ul class="space-y-1 text-xs text-red-600 list-disc list-inside">
          <li v-for="(r, i) in run.plan.risks" :key="i">{{ r }}</li>
        </ul>
      </div>
    </div>

    <!-- Execution results -->
    <div v-if="run.result?.commandResults?.length" class="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Execution ({{ run.result.commandResults.length }} commands)
      </h3>
      <div
        v-for="(cmd, idx) in run.result.commandResults"
        :key="idx"
        class="border border-slate-200 rounded-md overflow-hidden"
      >
        <button
          class="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
          @click="toggleCmd(idx)"
        >
          <div class="flex items-center gap-2">
            <span
              :class="['w-2 h-2 rounded-full flex-shrink-0', cmd.exitCode === 0 ? 'bg-green-500' : 'bg-red-500']"
            />
            <code class="text-xs text-slate-700">{{ cmd.command }}</code>
          </div>
          <span class="text-xs text-slate-400">{{ expandedCmd === idx ? '▲' : '▼' }}</span>
        </button>
        <div v-if="expandedCmd === idx" class="divide-y divide-slate-100">
          <div v-if="cmd.stdout" class="p-3">
            <div class="text-xs font-medium text-slate-400 mb-1">stdout</div>
            <pre class="text-xs text-slate-700 bg-slate-50 p-2 rounded overflow-x-auto max-h-48 whitespace-pre-wrap">{{ cmd.stdout }}</pre>
          </div>
          <div v-if="cmd.stderr" class="p-3">
            <div class="text-xs font-medium text-red-400 mb-1">stderr</div>
            <pre class="text-xs text-red-700 bg-red-50 p-2 rounded overflow-x-auto max-h-48 whitespace-pre-wrap">{{ cmd.stderr }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation -->
    <div v-if="run.validationOutput" class="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validation</h3>
      <div class="flex items-center gap-3">
        <StatusBadge :status="run.validationOutput.status === 'success' ? 'success' : 'failed'" />
        <span class="text-sm font-mono text-slate-600">
          Score: {{ run.validationOutput.quality_score }}/10
        </span>
      </div>
      <p class="text-xs text-slate-600">{{ run.validationOutput.reason }}</p>
      <p v-if="run.validationOutput.suggested_fix" class="text-xs text-amber-600 bg-amber-50 p-2 rounded">
        Fix: {{ run.validationOutput.suggested_fix }}
      </p>
    </div>

    <!-- Observability logs -->
    <div v-if="run.observabilityLogs?.length" class="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
      <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Agent Trace ({{ run.observabilityLogs.length }})
      </h3>
      <div class="space-y-1">
        <div
          v-for="(log, i) in run.observabilityLogs"
          :key="i"
          class="flex items-center gap-3 text-xs py-1.5 border-b border-slate-50"
        >
          <span class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 whitespace-nowrap">{{ log.agent }}</span>
          <span class="text-slate-400 font-mono">{{ log.latency }}ms</span>
          <span v-if="log.confidence !== undefined" class="text-slate-400 font-mono">
            conf: {{ log.confidence }}
          </span>
          <span class="text-slate-400 font-mono ml-auto">{{ new Date(log.timestamp).toLocaleTimeString() }}</span>
        </div>
      </div>
    </div>

    <!-- Raw JSON -->
    <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <button
        class="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-slate-50 transition-colors"
        @click="showRawJson = !showRawJson"
      >
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw JSON</span>
        <span class="text-xs text-slate-400">{{ showRawJson ? '▲ hide' : '▼ show' }}</span>
      </button>
      <div v-if="showRawJson" class="p-5 border-t border-slate-100">
        <pre class="text-xs text-slate-600 bg-slate-50 p-3 rounded overflow-x-auto max-h-96 whitespace-pre">{{ JSON.stringify(run, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>
