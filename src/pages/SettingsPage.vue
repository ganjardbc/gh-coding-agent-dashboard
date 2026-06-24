<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getSettings, updateSetting } from '@/services/settings-service'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'

const settings = ref({ ROUTER_BASE_URL: '', ROUTER_MODEL: '' })
const credentials = ref({ ROUTER_API_KEY: '', GITHUB_TOKEN: '', GITHUB_WEBHOOK_SECRET: '' })
const credentialStatus = ref({ ROUTER_API_KEY: false, GITHUB_TOKEN: false, GITHUB_WEBHOOK_SECRET: false })

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const saveResults = ref<{ key: string; ok: boolean; message: string }[]>([])

const showKeys = ref({ ROUTER_API_KEY: false, GITHUB_TOKEN: false, GITHUB_WEBHOOK_SECRET: false })

async function fetchSettings() {
  loading.value = true
  error.value = null
  try {
    const raw = await getSettings()
    settings.value.ROUTER_BASE_URL = raw.ROUTER_BASE_URL || ''
    settings.value.ROUTER_MODEL = raw.ROUTER_MODEL || ''
    credentialStatus.value.ROUTER_API_KEY = !!(raw.ROUTER_API_KEY)
    credentialStatus.value.GITHUB_TOKEN = !!(raw.GITHUB_TOKEN)
    credentialStatus.value.GITHUB_WEBHOOK_SECRET = !!(raw.GITHUB_WEBHOOK_SECRET)
    credentials.value = { ROUTER_API_KEY: '', GITHUB_TOKEN: '', GITHUB_WEBHOOK_SECRET: '' }
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch settings'
  } finally {
    loading.value = false
  }
}

async function saveAllSettings() {
  saving.value = true
  successMessage.value = null
  error.value = null
  saveResults.value = []

  const toSave: Array<[string, string]> = [
    ['ROUTER_BASE_URL', settings.value.ROUTER_BASE_URL],
    ['ROUTER_MODEL', settings.value.ROUTER_MODEL],
  ]
  if (credentials.value.ROUTER_API_KEY) toSave.push(['ROUTER_API_KEY', credentials.value.ROUTER_API_KEY])
  if (credentials.value.GITHUB_TOKEN) toSave.push(['GITHUB_TOKEN', credentials.value.GITHUB_TOKEN])
  if (credentials.value.GITHUB_WEBHOOK_SECRET) toSave.push(['GITHUB_WEBHOOK_SECRET', credentials.value.GITHUB_WEBHOOK_SECRET])

  const results = await Promise.allSettled(
    toSave.map(async ([key, value]) => {
      await updateSetting(key, value)
      return key
    })
  )

  const report: { key: string; ok: boolean; message: string }[] = []
  results.forEach((r, i) => {
    const key = toSave[i][0]
    if (r.status === 'fulfilled') {
      report.push({ key, ok: true, message: 'Saved' })
      if (key === 'ROUTER_API_KEY') { credentialStatus.value.ROUTER_API_KEY = true; credentials.value.ROUTER_API_KEY = '' }
      if (key === 'GITHUB_TOKEN') { credentialStatus.value.GITHUB_TOKEN = true; credentials.value.GITHUB_TOKEN = '' }
      if (key === 'GITHUB_WEBHOOK_SECRET') { credentialStatus.value.GITHUB_WEBHOOK_SECRET = true; credentials.value.GITHUB_WEBHOOK_SECRET = '' }
    } else {
      report.push({ key, ok: false, message: (r.reason as Error)?.message || 'Error' })
    }
  })

  const failed = report.filter(r => !r.ok)
  if (failed.length > 0) {
    saveResults.value = report
    error.value = `${failed.length} setting(s) failed to save`
  } else {
    successMessage.value = `${report.length} setting(s) saved successfully`
    setTimeout(() => { successMessage.value = null }, 3000)
  }

  saving.value = false
}

onMounted(fetchSettings)
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-slate-800">Settings</h1>
      <p class="text-xs text-slate-500 mt-0.5">Manage LLM configurations, GitHub integrations, and system-wide variables persisted in PostgreSQL.</p>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error && !saveResults.length" :message="error" @retry="fetchSettings" />

    <form v-else @submit.prevent="saveAllSettings" class="space-y-6">
      <!-- Success Banner -->
      <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2 shadow-sm">
        <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0" />
        <span class="font-medium">{{ successMessage }}</span>
      </div>

      <!-- Partial-failure results -->
      <div v-if="saveResults.length" class="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm space-y-1.5">
        <p class="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
          <Icon icon="lucide:alert-triangle" class="w-4 h-4" />
          {{ error }}
        </p>
        <ul class="text-xs space-y-0.5 mt-1">
          <li v-for="r in saveResults" :key="r.key" class="flex items-center gap-1.5">
            <Icon :icon="r.ok ? 'lucide:check' : 'lucide:x'" :class="r.ok ? 'text-green-600' : 'text-red-500'" class="w-3.5 h-3.5 flex-shrink-0" />
            <code class="font-mono text-[10px] text-slate-600">{{ r.key }}</code>
            <span :class="r.ok ? 'text-green-700' : 'text-red-600'">{{ r.message }}</span>
          </li>
        </ul>
      </div>

      <!-- LLM Router Settings -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Icon icon="lucide:cpu" class="w-4 h-4 text-slate-500" />
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">LLM Router Configuration</h2>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router Base URL</label>
            <input
              v-model="settings.ROUTER_BASE_URL"
              type="text"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
              placeholder="https://api.9router.io/v1"
            />
            <p class="text-[10px] text-slate-400 mt-1">Configured endpoint base. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">ROUTER_BASE_URL</code>)</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router Model ID</label>
            <input
              v-model="settings.ROUTER_MODEL"
              type="text"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
              placeholder="qoder-combo"
            />
            <p class="text-[10px] text-slate-400 mt-1">Active LLM identifier. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">ROUTER_MODEL</code>)</p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router API Key</label>
            <div class="relative">
              <input
                v-model="credentials.ROUTER_API_KEY"
                :type="showKeys.ROUTER_API_KEY ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="Enter new key to update..."
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.ROUTER_API_KEY = !showKeys.ROUTER_API_KEY"
              >
                <Icon :icon="showKeys.ROUTER_API_KEY ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] mt-1" :class="credentialStatus.ROUTER_API_KEY ? 'text-green-600' : 'text-amber-500'">
              <Icon :icon="credentialStatus.ROUTER_API_KEY ? 'lucide:shield-check' : 'lucide:alert-circle'" class="w-3 h-3 inline mr-0.5" />
              {{ credentialStatus.ROUTER_API_KEY ? 'Value currently set — leave blank to keep, or type to replace.' : 'Not configured — falls back to .env ROUTER_API_KEY.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- GitHub Settings -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Icon icon="lucide:github" class="w-4 h-4 text-slate-500" />
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">GitHub Integration</h2>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Personal Access Token</label>
            <div class="relative">
              <input
                v-model="credentials.GITHUB_TOKEN"
                :type="showKeys.GITHUB_TOKEN ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="Enter new token to update..."
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.GITHUB_TOKEN = !showKeys.GITHUB_TOKEN"
              >
                <Icon :icon="showKeys.GITHUB_TOKEN ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] mt-1" :class="credentialStatus.GITHUB_TOKEN ? 'text-green-600' : 'text-amber-500'">
              <Icon :icon="credentialStatus.GITHUB_TOKEN ? 'lucide:shield-check' : 'lucide:alert-circle'" class="w-3 h-3 inline mr-0.5" />
              {{ credentialStatus.GITHUB_TOKEN ? 'Value currently set — leave blank to keep, or type to replace.' : 'Not configured — falls back to .env GITHUB_TOKEN.' }}
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Webhook Secret</label>
            <div class="relative">
              <input
                v-model="credentials.GITHUB_WEBHOOK_SECRET"
                :type="showKeys.GITHUB_WEBHOOK_SECRET ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="Enter new secret to update..."
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.GITHUB_WEBHOOK_SECRET = !showKeys.GITHUB_WEBHOOK_SECRET"
              >
                <Icon :icon="showKeys.GITHUB_WEBHOOK_SECRET ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] mt-1" :class="credentialStatus.GITHUB_WEBHOOK_SECRET ? 'text-green-600' : 'text-amber-500'">
              <Icon :icon="credentialStatus.GITHUB_WEBHOOK_SECRET ? 'lucide:shield-check' : 'lucide:alert-circle'" class="w-3 h-3 inline mr-0.5" />
              {{ credentialStatus.GITHUB_WEBHOOK_SECRET ? 'Value currently set — leave blank to keep, or type to replace.' : 'Not configured — falls back to .env GITHUB_WEBHOOK_SECRET.' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Fallback note -->
      <div class="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs shadow-sm">
        <p class="font-medium flex items-center gap-1.5">
          <Icon icon="lucide:lightbulb" class="w-4 h-4 text-blue-600" />
          Fallback Behavior
        </p>
        <p class="mt-1 text-slate-600 leading-relaxed">
          Settings saved here override your server's local <code class="bg-blue-100 px-1 rounded">.env</code> values.
          Credential fields are left blank on load — type a new value only if you want to change it.
          Empty fields are not sent and existing values are preserved.
        </p>
      </div>

      <div class="flex items-center justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Icon :icon="saving ? 'lucide:loader-2' : 'lucide:save'" class="w-4 h-4 flex-shrink-0" :class="{ 'animate-spin': saving }" />
          <span>{{ saving ? 'Saving...' : 'Save Settings' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
