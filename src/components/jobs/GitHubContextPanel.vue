<script setup lang="ts">
import SourceBadge from '@/components/shared/SourceBadge.vue'
import type { GitHubJobContext, JobSource } from '@/types/github'

defineProps<{
  github: GitHubJobContext
  source?: JobSource
}>()
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-lg overflow-hidden">
    <div class="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
      <span class="text-xs font-medium text-slate-600 uppercase tracking-wider">GitHub Context</span>
      <SourceBadge v-if="source" :type="source.type" />
      <span
        v-if="source?.event"
        class="text-xs text-slate-400 font-mono"
      >{{ source.event }}</span>
    </div>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-xs">
      <div class="flex gap-2">
        <dt class="text-slate-400 w-24 flex-shrink-0">Repository</dt>
        <dd class="font-mono text-slate-700 font-medium">{{ github.owner }}/{{ github.repo }}</dd>
      </div>
      <div v-if="github.branch" class="flex gap-2">
        <dt class="text-slate-400 w-24 flex-shrink-0">Branch</dt>
        <dd class="font-mono text-slate-700">{{ github.branch }}</dd>
      </div>
      <div v-if="github.baseBranch" class="flex gap-2">
        <dt class="text-slate-400 w-24 flex-shrink-0">Base branch</dt>
        <dd class="font-mono text-slate-700">{{ github.baseBranch }}</dd>
      </div>
      <div v-if="github.issueNumber" class="flex gap-2">
        <dt class="text-slate-400 w-24 flex-shrink-0">Issue</dt>
        <dd>
          <span class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">#{{ github.issueNumber }}</span>
        </dd>
      </div>
      <div v-if="github.prNumber" class="flex gap-2">
        <dt class="text-slate-400 w-24 flex-shrink-0">Pull request</dt>
        <dd>
          <span class="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded font-mono">#{{ github.prNumber }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
