<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getGlobalFlowConfig,
  setGlobalFlowConfig,
  getScopeFlowConfig,
  setScopeFlowConfig,
  deleteScopeFlowConfig,
  getWorkerHealth,
  type AgentToggleMap,
  type WorkerHealthResponse,
} from '@/services/flow-config-service'
import { getAgents, type AgentMetadata } from '@/services/agents-service'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'

// ── State ─────────────────────────────────────────────────────────────────────

// Pipeline agents: toggleable ones + required (shown locked) — from /agents, single source of truth
const pipelineAgents = ref<AgentMetadata[]>([])

const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const successMessage = ref<string | null>(null)

const workerHealth = ref<WorkerHealthResponse | null>(null)
const workerHealthLoading = ref(false)

// Global config
const globalConfig = reactive<AgentToggleMap>({
  inspector: true,
  plannerB: true,
  reviewer: true,
  testGenerator: true,
  debugger: true,
  executor: true,
  validator: true,
  forceComplexity: null,
})

// Per-repo override
const scopeInput = ref('')
const scopeLoading = ref(false)
const scopeSaving = ref(false)
const scopeDeleting = ref(false)
const scopeError = ref<string | null>(null)
const scopeSuccess = ref<string | null>(null)
const scopeConfig = reactive<AgentToggleMap>({})
const scopeResolved = ref<AgentToggleMap | null>(null)
const scopeLoaded = ref(false)
const scopeHasOverride = ref(false)

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyConfig(target: AgentToggleMap, source: AgentToggleMap) {
  for (const agent of pipelineAgents.value) {
    if (!agent.toggleKey) continue
    const k = agent.toggleKey as keyof AgentToggleMap
    ;(target as Record<string, unknown>)[k] = (source as Record<string, unknown>)[k] ?? true
  }
  target.forceComplexity = source.forceComplexity ?? null
}

function flashSuccess(msgRef: typeof successMessage, msg: string) {
  msgRef.value = msg
  setTimeout(() => { msgRef.value = null }, 3000)
}

// ── Worker health ─────────────────────────────────────────────────────────────

async function fetchWorkerHealth() {
  workerHealthLoading.value = true
  try {
    workerHealth.value = await getWorkerHealth()
  } catch {
    workerHealth.value = null
  } finally {
    workerHealthLoading.value = false
  }
}

// ── Global config ─────────────────────────────────────────────────────────────

async function fetchGlobalConfig() {
  loading.value = true
  error.value = null
  try {
    const res = await getGlobalFlowConfig()
    applyConfig(globalConfig, res.config)
  } catch (err: any) {
    error.value = err.message || 'Failed to load global flow config'
  } finally {
    loading.value = false
  }
}

async function saveGlobalConfig() {
  saving.value = true
  try {
    await setGlobalFlowConfig({ ...globalConfig })
    flashSuccess(successMessage, 'Global flow config saved')
  } catch (err: any) {
    error.value = err.message || 'Failed to save'
  } finally {
    saving.value = false
  }
}

// ── Per-repo override ─────────────────────────────────────────────────────────

async function loadScope() {
  if (!scopeInput.value.trim()) return
  scopeLoading.value = true
  scopeError.value = null
  scopeLoaded.value = false
  try {
    const res = await getScopeFlowConfig(scopeInput.value.trim())
    const hasOverride = Object.keys(res.config).length > 0
    scopeHasOverride.value = hasOverride
    // Populate scope config: use resolved as base, then layer in per-repo overrides
    applyConfig(scopeConfig, res.resolved ?? {})
    // Mark which keys are actually overridden
    scopeResolved.value = res.resolved ?? null
    scopeLoaded.value = true
  } catch (err: any) {
    scopeError.value = err.message || 'Failed to load scope config'
  } finally {
    scopeLoading.value = false
  }
}

async function saveScopeConfig() {
  if (!scopeInput.value.trim()) return
  scopeSaving.value = true
  scopeError.value = null
  try {
    await setScopeFlowConfig(scopeInput.value.trim(), { ...scopeConfig })
    scopeHasOverride.value = true
    flashSuccess(scopeSuccess, `Override saved for "${scopeInput.value.trim()}"`)
  } catch (err: any) {
    scopeError.value = err.message || 'Failed to save override'
  } finally {
    scopeSaving.value = false
  }
}

async function deleteScopeConfig() {
  if (!scopeInput.value.trim()) return
  scopeDeleting.value = true
  scopeError.value = null
  try {
    await deleteScopeFlowConfig(scopeInput.value.trim())
    scopeHasOverride.value = false
    flashSuccess(scopeSuccess, `Override deleted — "${scopeInput.value.trim()}" now inherits global config`)
    await loadScope()
  } catch (err: any) {
    scopeError.value = err.message || 'Failed to delete override'
  } finally {
    scopeDeleting.value = false
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  const all = await getAgents().catch(() => [])
  pipelineAgents.value = all.filter((a) => !!a.toggleKey || !!a.required)
  fetchGlobalConfig()
  fetchWorkerHealth()
})
</script>

<template>
  <div class="p-4 sm:p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">Flow Config</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Control which agents run in each pipeline. Global config applies to all repos; per-repo overrides take precedence.
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors shadow-sm flex-shrink-0"
        @click="() => { fetchGlobalConfig(); fetchWorkerHealth() }"
      >
        <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Worker Health Card -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="lucide:server" class="w-4 h-4 text-slate-500" />
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker Health</h2>
        </div>
        <button
          class="text-slate-400 hover:text-slate-600"
          :title="workerHealthLoading ? 'Refreshing...' : 'Refresh worker health'"
          @click="fetchWorkerHealth"
        >
          <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" :class="{ 'animate-spin': workerHealthLoading }" />
        </button>
      </div>
      <div class="p-5">
        <div v-if="workerHealthLoading && !workerHealth" class="text-xs text-slate-400 py-2">Checking worker...</div>
        <div v-else-if="!workerHealth" class="text-xs text-slate-400 py-2">Could not reach worker health endpoint.</div>
        <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <!-- Redis Status -->
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Redis</span>
            <div class="flex items-center gap-1.5">
              <span
                :class="[
                  'inline-block w-2 h-2 rounded-full flex-shrink-0',
                  workerHealth.redis === 'ok' ? 'bg-green-500' : 'bg-red-500'
                ]"
              />
              <span
                :class="[
                  'text-xs font-semibold',
                  workerHealth.redis === 'ok' ? 'text-green-700' : 'text-red-700'
                ]"
              >{{ workerHealth.redis === 'ok' ? 'Connected' : 'Error' }}</span>
            </div>
            <p v-if="workerHealth.redisError" class="text-[10px] text-red-500 font-mono truncate" :title="workerHealth.redisError">
              {{ workerHealth.redisError }}
            </p>
          </div>

          <!-- Concurrency -->
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Concurrency</span>
            <span class="text-lg font-bold text-slate-800 font-mono leading-tight">{{ workerHealth.workerConfig.concurrency }}</span>
            <span class="text-[10px] text-slate-400">parallel jobs</span>
          </div>

          <!-- Lock Duration -->
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lock Duration</span>
            <span class="text-lg font-bold text-slate-800 font-mono leading-tight">{{ Math.round(workerHealth.workerConfig.lockDuration / 60_000) }}m</span>
            <span class="text-[10px] text-slate-400">job timeout</span>
          </div>

          <!-- Queue Stats -->
          <div v-if="workerHealth.queue" class="flex flex-col gap-1">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Queue</span>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono rounded">
                <Icon icon="lucide:clock" class="w-2.5 h-2.5" /> {{ workerHealth.queue.waiting }} waiting
              </span>
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-mono rounded">
                <Icon icon="lucide:zap" class="w-2.5 h-2.5" /> {{ workerHealth.queue.active }} active
              </span>
              <span v-if="workerHealth.queue.failed > 0" class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-mono rounded">
                <Icon icon="lucide:x-circle" class="w-2.5 h-2.5" /> {{ workerHealth.queue.failed }} failed
              </span>
            </div>
          </div>
        </div>

        <div v-if="workerHealth && workerHealth.redis !== 'ok'" class="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700">
          <span class="font-semibold">Worker may not be processing jobs.</span> Check that Redis is running at the configured host/port and that the worker process is started (<code class="bg-red-100 px-1 rounded">npm run worker</code>).
        </div>
      </div>
    </div>

    <!-- Loading / Error States for global config -->
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchGlobalConfig" />

    <!-- Global Flow Config -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Icon icon="lucide:sliders-horizontal" class="w-4 h-4 text-slate-500" />
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Agent Toggles</h2>
        <span class="ml-auto text-[10px] text-slate-400">applies to all repos unless overridden</span>
      </div>

      <div class="p-5 space-y-5">
        <!-- Success Banner -->
        <div
          v-if="successMessage"
          class="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs flex items-center gap-2"
        >
          <Icon icon="lucide:check-circle" class="w-4 h-4 text-green-600 flex-shrink-0" />
          <span class="font-medium">{{ successMessage }}</span>
        </div>

        <!-- Agent Toggles Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="agent in pipelineAgents"
            :key="agent.id"
            :class="[
              'flex items-start gap-3 p-3.5 rounded-lg border select-none',
              agent.required
                ? 'border-slate-200 bg-slate-50/30 cursor-default'
                : (globalConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                  ? 'border-blue-200 bg-blue-50/50 cursor-pointer'
                  : 'border-slate-200 bg-slate-50/50 cursor-pointer'
            ]"
            @click="!agent.required && ((globalConfig as Record<string, unknown>)[agent.toggleKey!] = (globalConfig as Record<string, unknown>)[agent.toggleKey!] === false ? true : false)"
          >
            <!-- Icon -->
            <div
              :class="[
                'p-2 rounded-md flex-shrink-0',
                agent.required
                  ? 'bg-slate-100 text-slate-400'
                  : (globalConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-slate-200 text-slate-400'
              ]"
            >
              <Icon :icon="agent.icon" class="w-4 h-4" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-semibold text-slate-700">{{ agent.name }}</span>
                <span
                  v-if="agent.required"
                  class="px-1.5 py-0.5 text-[9px] font-mono bg-slate-200 text-slate-500 rounded"
                >required</span>
                <span
                  v-else-if="agent.toggleTag"
                  class="px-1.5 py-0.5 text-[9px] font-mono bg-slate-100 text-slate-500 rounded"
                >{{ agent.toggleTag }}</span>
              </div>
              <p class="text-[10px] mt-0.5 leading-relaxed text-slate-400">
                <span
                  v-if="!agent.required && (globalConfig as Record<string, unknown>)[agent.toggleKey!] === false"
                  class="text-amber-600 font-medium"
                >Disabled — </span>
                {{ agent.required ? 'Always runs — cannot be disabled.' : agent.toggleImpact }}
              </p>
            </div>

            <!-- Toggle: locked for required, interactive for toggleable -->
            <div class="flex-shrink-0 pt-0.5">
              <button
                :disabled="agent.required"
                :class="[
                  'relative inline-flex h-5 w-9 items-center rounded-full focus:outline-none',
                  agent.required
                    ? 'bg-slate-300 cursor-not-allowed'
                    : (globalConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                      ? 'bg-blue-600 cursor-pointer'
                      : 'bg-slate-300 cursor-pointer'
                ]"
                :aria-label="agent.required ? `${agent.name} (required)` : `Toggle ${agent.name}`"
                @click.stop="!agent.required && ((globalConfig as Record<string, unknown>)[agent.toggleKey!] = (globalConfig as Record<string, unknown>)[agent.toggleKey!] === false ? true : false)"
              >
                <span
                  :class="[
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    agent.required || (globalConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                      ? 'translate-x-[18px]'
                      : 'translate-x-[2px]'
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Force Complexity -->
        <div class="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-md bg-slate-200 text-slate-500 flex-shrink-0">
              <Icon icon="lucide:brain-circuit" class="w-4 h-4" />
            </div>
            <div class="flex-1">
              <label class="text-xs font-semibold text-slate-700 block mb-1">Force Complexity</label>
              <p class="text-[10px] text-slate-500 mb-2">Override auto-detection. <code class="bg-slate-100 px-1 rounded">auto</code> = detect from task keywords/length.</p>
              <select
                v-model="globalConfig.forceComplexity"
                class="border border-slate-200 rounded-md px-2.5 py-1.5 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option :value="null">auto (default)</option>
                <option value="low">low — Planner A only, 1 retry</option>
                <option value="high">high — Hybrid planner, 2 retries</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="flex justify-end">
          <button
            :disabled="saving"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
            @click="saveGlobalConfig"
          >
            <Icon
              :icon="saving ? 'lucide:loader-2' : 'lucide:save'"
              class="w-4 h-4 flex-shrink-0"
              :class="{ 'animate-spin': saving }"
            />
            {{ saving ? 'Saving...' : 'Save Global Config' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Per-Repo Override -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <Icon icon="lucide:folder-git-2" class="w-4 h-4 text-slate-500" />
        <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Per-Repo Override</h2>
        <span class="ml-auto text-[10px] text-slate-400">merges on top of global config</span>
      </div>

      <div class="p-5 space-y-4">
        <!-- Scope input -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Repo Scope</label>
          <div class="flex gap-2">
            <input
              v-model="scopeInput"
              type="text"
              class="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              placeholder="local:my-repo or github/owner/repo"
              @keydown.enter="loadScope"
            />
            <button
              :disabled="!scopeInput.trim() || scopeLoading"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
              @click="loadScope"
            >
              <Icon
                :icon="scopeLoading ? 'lucide:loader-2' : 'lucide:search'"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': scopeLoading }"
              />
              Load
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-1">
            Examples: <code class="bg-slate-100 px-1 rounded">local:my-repo</code>, <code class="bg-slate-100 px-1 rounded">github/owner/repo</code>
          </p>
        </div>

        <!-- Scope error -->
        <div
          v-if="scopeError"
          class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2"
        >
          <Icon icon="lucide:alert-circle" class="w-4 h-4 flex-shrink-0" />
          {{ scopeError }}
        </div>

        <!-- Scope success -->
        <div
          v-if="scopeSuccess"
          class="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center gap-2"
        >
          <Icon icon="lucide:check-circle" class="w-4 h-4 flex-shrink-0" />
          {{ scopeSuccess }}
        </div>

        <!-- Loaded scope config -->
        <div v-if="scopeLoaded">
          <!-- Override badge -->
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs font-semibold text-slate-700 font-mono">{{ scopeInput.trim() }}</span>
            <span
              :class="[
                'px-2 py-0.5 text-[10px] font-medium rounded-full',
                scopeHasOverride
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              ]"
            >
              {{ scopeHasOverride ? 'Has override' : 'Inheriting global' }}
            </span>
          </div>

          <!-- Scope agent toggles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <div
              v-for="agent in pipelineAgents"
              :key="agent.id"
              :class="[
                'flex items-center gap-2.5 p-3 rounded-lg border select-none',
                agent.required
                  ? 'border-slate-200 bg-slate-50/30 cursor-default'
                  : (scopeConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                    ? 'border-blue-200 bg-blue-50/50 cursor-pointer'
                    : 'border-slate-200 bg-slate-50 cursor-pointer'
              ]"
              @click="!agent.required && ((scopeConfig as Record<string, unknown>)[agent.toggleKey!] = (scopeConfig as Record<string, unknown>)[agent.toggleKey!] === false ? true : false)"
            >
              <Icon
                :icon="agent.icon"
                :class="[
                  'w-3.5 h-3.5 flex-shrink-0',
                  agent.required
                    ? 'text-slate-300'
                    : (scopeConfig as Record<string, unknown>)[agent.toggleKey!] !== false ? 'text-blue-500' : 'text-slate-400'
                ]"
              />
              <span
                :class="[
                  'flex-1 text-xs font-medium',
                  agent.required ? 'text-slate-400' : (scopeConfig as Record<string, unknown>)[agent.toggleKey!] !== false ? 'text-slate-700' : 'text-slate-400'
                ]"
              >{{ agent.name }}</span>
              <span v-if="agent.required" class="text-[9px] font-mono text-slate-400 mr-1">required</span>
              <button
                :disabled="agent.required"
                :class="[
                  'relative inline-flex h-4 w-7 items-center rounded-full flex-shrink-0 focus:outline-none',
                  agent.required
                    ? 'bg-slate-200 cursor-not-allowed'
                    : (scopeConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                      ? 'bg-blue-600 cursor-pointer'
                      : 'bg-slate-300 cursor-pointer'
                ]"
                @click.stop="!agent.required && ((scopeConfig as Record<string, unknown>)[agent.toggleKey!] = (scopeConfig as Record<string, unknown>)[agent.toggleKey!] === false ? true : false)"
              >
                <span
                  :class="[
                    'inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform',
                    agent.required || (scopeConfig as Record<string, unknown>)[agent.toggleKey!] !== false
                      ? 'translate-x-[14px]'
                      : 'translate-x-[2px]'
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Scope force complexity -->
          <div class="border border-slate-200 rounded-lg p-3 bg-slate-50/50 mb-4 flex items-center gap-3">
            <Icon icon="lucide:brain-circuit" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <label class="text-xs font-medium text-slate-600 flex-shrink-0">Force Complexity</label>
            <select
              v-model="scopeConfig.forceComplexity"
              class="border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ml-auto"
            >
              <option :value="null">inherit from global</option>
              <option value="low">low</option>
              <option value="high">high</option>
            </select>
          </div>

          <!-- Scope actions -->
          <div class="flex items-center gap-2">
            <button
              :disabled="scopeSaving"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
              @click="saveScopeConfig"
            >
              <Icon
                :icon="scopeSaving ? 'lucide:loader-2' : 'lucide:save'"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': scopeSaving }"
              />
              {{ scopeSaving ? 'Saving...' : 'Save Override' }}
            </button>
            <button
              v-if="scopeHasOverride"
              :disabled="scopeDeleting"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white hover:bg-red-50 disabled:opacity-50 text-red-600 border border-red-200 rounded-lg transition-colors font-medium"
              @click="deleteScopeConfig"
            >
              <Icon
                :icon="scopeDeleting ? 'lucide:loader-2' : 'lucide:rotate-ccw'"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin': scopeDeleting }"
              />
              {{ scopeDeleting ? 'Resetting...' : 'Reset to Global' }}
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!scopeLoading" class="py-6 text-center text-slate-400">
          <Icon icon="lucide:folder-search" class="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p class="text-xs">Enter a repo scope above and click Load to view or edit its override.</p>
        </div>
      </div>
    </div>

    <!-- Info callout -->
    <div class="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs shadow-sm">
      <p class="font-medium flex items-center gap-1.5">
        <Icon icon="lucide:info" class="w-4 h-4 text-blue-600" />
        How flow config merges
      </p>
      <ul class="mt-1.5 text-slate-600 leading-relaxed space-y-0.5 list-disc list-inside">
        <li>Per-repo config overrides global config for each key that's explicitly set.</li>
        <li>Keys not set in per-repo config inherit from global. Keys not in global use defaults (all ON).</li>
        <li>Changes take effect on the next job run — no restart required.</li>
      </ul>
    </div>
  </div>
</template>
