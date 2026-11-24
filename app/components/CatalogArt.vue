<script setup lang="ts">
import type { Offering } from '#shared/types'
defineProps<{ item: Offering }>()
</script>
<template>
  <div :class="['catalog-art', item.color]" aria-hidden="true">
    <span class="art-orbit" />
    <span class="art-tile"><Glyph :name="item.icon" /></span>
    <span class="art-corner" />
  </div>
</template>
