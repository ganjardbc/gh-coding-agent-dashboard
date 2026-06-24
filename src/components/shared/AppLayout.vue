<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'

const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { to: '/', label: 'Overview', icon: 'lucide:layout-dashboard' },
  { to: '/new-task', label: 'New Task', icon: 'lucide:plus-circle' },
  { to: '/repositories', label: 'Repositories', icon: 'lucide:folder' },
  { to: '/jobs', label: 'Local Runs', icon: 'lucide:play-circle' },
  { to: '/github-jobs', label: 'GitHub Runs', icon: 'lucide:github' },
  { to: '/runs', label: 'Runs', icon: 'lucide:file-text' },
  { to: '/agents', label: 'Agents', icon: 'lucide:bot' },
  { to: '/settings', label: 'Settings', icon: 'lucide:wrench' },
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

watch(() => route.path, () => { sidebarOpen.value = false })
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/50 z-20 md:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-30 w-80 bg-slate-900 flex flex-col transition-transform duration-200',
        'md:relative md:w-72 md:translate-x-0 md:flex-shrink-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <div class="px-4 py-5 border-b border-slate-700/50 flex items-center justify-between">
        <div>
          <div class="text-white font-semibold text-sm tracking-wide">GH Coding Agent</div>
          <div class="text-slate-400 text-xs mt-0.5 font-mono">Operator Dashboard</div>
        </div>
        <button
          class="md:hidden text-slate-400 hover:text-slate-200 p-1 rounded flex items-center justify-center"
          aria-label="Close menu"
          @click="sidebarOpen = false"
        >
          <Icon icon="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <nav class="flex-1 px-2 py-4 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
            isActive(item.to)
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
          ]"
        >
          <Icon :icon="item.icon" class="w-4 h-4 text-center leading-none flex-shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-4 py-3 border-t border-slate-700/50">
        <div class="text-slate-600 text-xs font-mono text-center">v1.0.0</div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header class="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          class="text-slate-600 hover:text-slate-800 p-1.5 rounded flex items-center justify-center"
          aria-label="Open menu"
          @click="sidebarOpen = true"
        >
          <Icon icon="lucide:menu" class="w-5 h-5" />
        </button>
        <span class="text-sm font-semibold text-slate-800">GH Coding Agent</span>
      </header>

      <main class="flex-1 overflow-y-auto">
        <div class="max-w-6xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
