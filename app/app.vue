<script setup lang="ts">
import type { DemoState } from '#shared/types'
const current = useState<DemoState | null>('demo')
const issue = useState('startup-error', () => '')
const route = useRoute()
useHead({ title: useAppName() })
</script>
<template>
  <UApp>
    <div v-if="!current" class="standalone">
      <div class="panel login-card">
        <BrandMark />
        <h1>{{ issue ? 'Workspace unavailable' : 'Loading workspace' }}</h1>
        <p aria-live="polite">{{ issue || 'Opening the sample records…' }}</p>
        <button v-if="issue" class="btn primary" @click="reloadNuxtApp({ force: true })">
          Retry
        </button>
      </div>
    </div>
    <NuxtPage v-else-if="route.path === '/login'" />
    <AppShell v-else><NuxtPage /></AppShell>
  </UApp>
</template>
