<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="flex items-center justify-center py-16">
    <div class="text-center">
      <div class="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
      <p class="text-sm text-slate-500">{{ message ?? 'Loading…' }}</p>
    </div>
  </div>
</template>
