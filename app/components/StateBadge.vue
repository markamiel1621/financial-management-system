<script setup lang="ts">
import { statusTone } from '#shared/orders'
defineProps<{ value: string }>()
const colors = {
  green: 'success',
  amber: 'warning',
  rose: 'error',
  violet: 'primary',
  neutral: 'neutral',
} as const
</script>
<template>
  <UBadge
    :color="colors[statusTone(value)]"
    variant="subtle"
    size="sm"
    class="w-fit whitespace-nowrap"
  >
    <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ value }}
  </UBadge>
</template>
