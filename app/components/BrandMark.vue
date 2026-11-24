<script setup lang="ts">
const appName = useAppName()
</script>
<template>
  <span class="brand" :aria-label="appName">
    <span class="brand-icon" aria-hidden="true">
      <b />
      <i />
      <em />
    </span>
    <span class="brand-name">{{ appName }}</span>
  </span>
</template>
