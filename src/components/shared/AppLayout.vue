<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

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
</script>

<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-52 bg-slate-900 flex flex-col flex-shrink-0">
      <div class="px-4 py-5 border-b border-slate-700/50">
        <div class="text-white font-semibold text-sm tracking-wide">GH Coding Agent</div>
        <div class="text-slate-400 text-xs mt-0.5 font-mono">Operator Dashboard</div>
      </div>

      <nav class="flex-1 px-2 py-4 space-y-0.5">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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

    <!-- Main content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
