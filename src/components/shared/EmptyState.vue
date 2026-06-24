<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(
  defineProps<{
    icon?: string
    title?: string
    description?: string
    actionText?: string
    // Backward compatibility props
    message?: string
    hint?: string
  }>(),
  {
    icon: 'lucide:inbox',
  }
)

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-8 py-12 text-center shadow-sm flex flex-col items-center justify-center">
    <!-- Icon -->
    <div class="p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-full mb-4">
      <Icon :icon="icon" class="w-8 h-8" />
    </div>

    <!-- Title -->
    <h3 class="text-sm font-semibold text-slate-800">
      {{ title || message || 'No data found' }}
    </h3>

    <!-- Description -->
    <p v-if="description || hint" class="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
      {{ description || hint }}
    </p>

    <!-- Action Button -->
    <button
      v-if="actionText"
      type="button"
      class="mt-5 px-4 py-2 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-sm transition-colors inline-flex items-center gap-1.5"
      @click="$emit('action')"
    >
      <Icon icon="lucide:plus" class="w-3.5 h-3.5" />
      {{ actionText }}
    </button>
  </div>
</template>
