<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getAgents, type AgentMetadata } from '@/services/agents-service'
import LoadingState from '@/components/shared/LoadingState.vue'
import ErrorState from '@/components/shared/ErrorState.vue'

const agents = ref<AgentMetadata[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchAgents() {
  loading.value = true
  error.value = null
  try {
    agents.value = await getAgents()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch agents info'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAgents)
</script>

<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 gap-2">
      <div>
        <h1 class="text-xl font-semibold text-slate-800">AI & Executor Agents</h1>
        <p class="text-xs text-slate-500 mt-0.5">Explore roles, file pathways, and capabilities of the coding pipeline agents.</p>
      </div>
      <button
        class="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
        @click="fetchAgents"
      >
        <Icon icon="lucide:refresh-cw" class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        Refresh
      </button>
    </div>

    <!-- Loading / Error States -->
    <LoadingState v-if="loading && agents.length === 0" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchAgents" />

    <!-- Grid of Agents -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col group"
      >
        <!-- Card Header -->
        <div class="p-5 border-b border-slate-100 flex items-start gap-4 bg-slate-50/50">
          <div class="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <Icon :icon="agent.icon || 'lucide:bot'" class="w-6 h-6" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-sm font-semibold text-slate-800 font-sans">{{ agent.name }}</h3>
              <span class="px-2 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-700 rounded-full font-mono">
                {{ agent.id }}
              </span>
            </div>
            <p class="text-xs text-blue-600 font-medium mt-0.5">{{ agent.role }}</p>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
          <!-- Description -->
          <p class="text-xs text-slate-600 leading-relaxed">{{ agent.description }}</p>

          <!-- Capabilities -->
          <div>
            <span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Capabilities</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="cap in agent.capabilities"
                :key="cap"
                class="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded-md border border-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-default"
              >
                {{ cap }}
              </span>
            </div>
          </div>

          <!-- Metadata -->
          <div class="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500 font-mono">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Model Specialist:</span>
              <span class="text-slate-700 font-medium">{{ agent.modelType }}</span>
            </div>
            <div class="flex items-center justify-between gap-4">
              <span class="text-slate-400 flex-shrink-0">Source Code:</span>
              <span class="text-slate-600 truncate bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 max-w-xs" :title="agent.filePath">
                {{ agent.filePath }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
