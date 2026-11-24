<script setup lang="ts">
import { statusTone } from '#shared/orders'
defineProps<{ value: string }>()
</script>
<template>
  <span class="state-badge" :class="'state-' + statusTone(value)">
    <i aria-hidden="true" />
    {{ value }}
  </span>
</template>
