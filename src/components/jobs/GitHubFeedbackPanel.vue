<script setup lang="ts">
import type { GitHubFeedback } from '@/types/github'

defineProps<{ feedback: GitHubFeedback }>()
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div class="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
      <span class="text-xs font-medium text-slate-600 uppercase tracking-wider">GitHub Feedback</span>
    </div>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-xs">
      <div class="flex gap-2">
        <dt class="text-slate-400 w-28 flex-shrink-0">Comment posted</dt>
        <dd>
          <span
            :class="feedback.posted ? 'text-green-600' : 'text-slate-400'"
          >{{ feedback.posted ? '✓ Yes' : '✗ No' }}</span>
        </dd>
      </div>
      <div v-if="feedback.targetType" class="flex gap-2">
        <dt class="text-slate-400 w-28 flex-shrink-0">Target</dt>
        <dd class="font-mono text-slate-700">
          {{ feedback.targetType }} #{{ feedback.targetNumber }}
        </dd>
      </div>
      <div v-if="feedback.commentUrl" class="flex gap-2 sm:col-span-2">
        <dt class="text-slate-400 w-28 flex-shrink-0">Comment URL</dt>
        <dd>
          <a
            :href="feedback.commentUrl"
            target="_blank"
            rel="noopener"
            class="text-blue-600 hover:underline font-mono break-all"
          >{{ feedback.commentUrl }}</a>
        </dd>
      </div>
    </dl>
  </div>
</template>
