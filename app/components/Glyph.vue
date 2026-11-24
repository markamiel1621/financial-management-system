<script setup lang="ts">
defineProps<{ name: string }>()
</script>
<template><UIcon :name="'i-lucide-' + name" class="glyph" aria-hidden="true" /></template>
