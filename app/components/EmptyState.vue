<script setup lang="ts">
withDefaults(defineProps<{ title: string; text?: string; icon?: string }>(), { icon: 'inbox' })
</script>
<template>
  <div class="empty-state">
    <span class="icon-box purple"><Glyph :name="icon" /></span>
    <h3>{{ title }}</h3>
    <p v-if="text">{{ text }}</p>
    <slot />
  </div>
</template>
