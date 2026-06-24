<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getSettings, updateSetting } from '@/services/settings-service'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'

const settings = ref<Record<string, string>>({})
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// For toggling password visibility
const showKeys = ref<Record<string, boolean>>({
  ROUTER_API_KEY: false,
  GITHUB_TOKEN: false,
  GITHUB_WEBHOOK_SECRET: false,
})

async function fetchSettings() {
  loading.value = true
  error.value = null
  try {
    settings.value = await getSettings()
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
  try {
    // Save all settings in parallel
    await Promise.all(
      Object.entries(settings.value).map(([key, value]) => updateSetting(key, value))
    )
    successMessage.value = 'Settings saved successfully'
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err: any) {
    error.value = err.message || 'Failed to save settings'
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-semibold text-slate-800">Settings</h1>
      <p class="text-xs text-slate-500 mt-0.5">Manage LLM configurations, GitHub integrations, and system-wide variables persisted in PostgreSQL.</p>
    </div>

    <!-- Loading / Error States -->
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchSettings" />

    <form v-else @submit.prevent="saveAllSettings" class="space-y-6">
      <!-- Success Banner -->
      <div v-if="successMessage" class="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2 shadow-sm">
        <Icon icon="lucide:check-circle" class="w-5 h-5 text-green-600 flex-shrink-0" />
        <span class="font-medium">{{ successMessage }}</span>
      </div>

      <!-- LLM Router Settings -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div class="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Icon icon="lucide:cpu" class="w-4 h-4 text-slate-500" />
          <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">LLM Router Configuration</h2>
        </div>
        <div class="p-5 space-y-4">
          <!-- Router Base URL -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router Base URL</label>
            <input
              v-model="settings.ROUTER_BASE_URL"
              type="text"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
              placeholder="https://api.9router.io/v1"
              required
            />
            <p class="text-[10px] text-slate-400 mt-1">Configured endpoint base. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">ROUTER_BASE_URL</code>)</p>
          </div>

          <!-- Router Model -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router Model ID</label>
            <input
              v-model="settings.ROUTER_MODEL"
              type="text"
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
              placeholder="qoder-combo"
              required
            />
            <p class="text-[10px] text-slate-400 mt-1">Active LLM identifier. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">ROUTER_MODEL</code>)</p>
          </div>

          <!-- Router API Key -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Router API Key</label>
            <div class="relative">
              <input
                v-model="settings.ROUTER_API_KEY"
                :type="showKeys.ROUTER_API_KEY ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="sk-..."
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.ROUTER_API_KEY = !showKeys.ROUTER_API_KEY"
              >
                <Icon :icon="showKeys.ROUTER_API_KEY ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">API Key for AI orchestrations. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">ROUTER_API_KEY</code>)</p>
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
          <!-- GITHUB_TOKEN -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Personal Access Token</label>
            <div class="relative">
              <input
                v-model="settings.GITHUB_TOKEN"
                :type="showKeys.GITHUB_TOKEN ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="ghp_..."
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.GITHUB_TOKEN = !showKeys.GITHUB_TOKEN"
              >
                <Icon :icon="showKeys.GITHUB_TOKEN ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Token for repository checkout/clones. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">GITHUB_TOKEN</code>)</p>
          </div>

          <!-- GITHUB_WEBHOOK_SECRET -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1.5">Webhook Secret</label>
            <div class="relative">
              <input
                v-model="settings.GITHUB_WEBHOOK_SECRET"
                :type="showKeys.GITHUB_WEBHOOK_SECRET ? 'text' : 'password'"
                class="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow font-mono"
                placeholder="Webhook secret..."
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 flex items-center justify-center p-1 rounded-full hover:bg-slate-100"
                @click="showKeys.GITHUB_WEBHOOK_SECRET = !showKeys.GITHUB_WEBHOOK_SECRET"
              >
                <Icon :icon="showKeys.GITHUB_WEBHOOK_SECRET ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Secret used to verify webhook event payloads. (Fallback to .env: <code class="bg-slate-100 px-1 rounded">GITHUB_WEBHOOK_SECRET</code>)</p>
          </div>
        </div>
      </div>

      <!-- Environment Fallback Note -->
      <div class="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-xl text-xs shadow-sm">
        <p class="font-medium flex items-center gap-1.5">
          <Icon icon="lucide:lightbulb" class="w-4 h-4 text-blue-600" />
          Fallback Behavior
        </p>
        <p class="mt-1 text-slate-600 leading-relaxed">
          Settings configured here will override your server's local <code class="bg-blue-100 px-1 rounded">.env</code> values. 
          If a value is left blank, the application will automatically fall back to the environment variable set on the host system.
        </p>
      </div>

      <!-- Form Action Button -->
      <div class="flex items-center justify-end">
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Icon :icon="saving ? 'lucide:loader-2' : 'lucide:save'" class="w-4 h-4 flex-shrink-0" :class="{ 'animate-spin': saving }" />
          <span>{{ saving ? 'Saving Settings...' : 'Save Settings' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
