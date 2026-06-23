<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const sidebarOpen = ref(false)

const navItems = [
  { to: '/', label: 'Overview', icon: '◈' },
  { to: '/new-task', label: 'New Task', icon: '＋' },
  { to: '/jobs', label: 'Jobs', icon: '⚙' },
  { to: '/runs', label: 'Runs', icon: '📄' },
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
          class="md:hidden text-slate-400 hover:text-slate-200 p-1 rounded"
          aria-label="Close menu"
          @click="sidebarOpen = false"
        >
          ✕
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
          <span class="text-xs w-4 text-center leading-none">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-4 py-3 border-t border-slate-700/50">
        <div class="text-slate-600 text-xs font-mono">v1.0.0</div>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header class="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
        <button
          class="text-slate-600 hover:text-slate-800 p-1 rounded"
          aria-label="Open menu"
          @click="sidebarOpen = true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="2" y="9.25" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="2" y="13.5" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
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
