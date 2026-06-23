<script setup lang="ts">
defineProps<{ message?: string; hint?: string }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="text-slate-300 text-4xl mb-3">○</div>
    <p class="text-sm font-medium text-slate-500">{{ message ?? 'Nothing here yet' }}</p>
    <p v-if="hint" class="text-xs text-slate-400 mt-1">{{ hint }}</p>
  </div>
</template>
