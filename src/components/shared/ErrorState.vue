<script setup lang="ts">
const props = defineProps<{ message: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div class="text-red-400 text-3xl mb-3">⚠</div>
    <p class="text-sm font-medium text-red-600">{{ props.message }}</p>
    <button
      class="mt-4 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors"
      @click="emit('retry')"
    >
      Retry
    </button>
  </div>
</template>
