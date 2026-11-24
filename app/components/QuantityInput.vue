<script setup lang="ts">
defineProps<{ max: number; label: string }>()
const quantity = defineModel<number>()
</script>
<template>
  <UInputNumber
    v-model="quantity"
    :min="1"
    :max="Math.max(1, max)"
    :disabled="max < 1"
    :aria-label="label"
    class="w-32"
  >
    <template #decrement>
      <UButton icon="i-lucide-minus" variant="link" size="sm" :aria-label="'Decrease ' + label" />
    </template>
    <template #increment>
      <UButton icon="i-lucide-plus" variant="link" size="sm" :aria-label="'Increase ' + label" />
    </template>
  </UInputNumber>
</template>
