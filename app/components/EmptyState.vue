<script setup lang="ts">
withDefaults(defineProps<{ title: string; text?: string; icon?: string }>(), { icon: 'inbox' })
</script>
<template>
  <UEmpty :title="title" :description="text" :icon="'i-lucide-' + icon" variant="naked">
    <template v-if="$slots.default" #actions><slot /></template>
  </UEmpty>
</template>
