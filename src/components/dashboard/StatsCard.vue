<script setup lang="ts">
defineProps<{
  label: string
  value: number | string
  color?: 'default' | 'blue' | 'amber' | 'green' | 'red'
}>()

const colorMap = {
  default: 'text-slate-700',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  green: 'text-green-600',
  red: 'text-red-600',
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg px-5 py-4">
    <div class="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{{ label }}</div>
    <div :class="['text-3xl font-bold font-mono', colorMap[color ?? 'default']]">{{ value }}</div>
  </div>
</template>
