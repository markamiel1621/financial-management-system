<script setup lang="ts">
const props = defineProps<{ value: number; max: number; label: string }>()
const emit = defineEmits<{ change: [number] }>()
function update(event: Event) {
  const field = event.target as HTMLInputElement
  const next = Number(field.value)
  if (Number.isInteger(next) && next >= 1 && next <= props.max) emit('change', next)
  else field.value = String(props.value)
}
</script>
<template>
  <div class="quantity">
    <button
      type="button"
      :aria-label="'Decrease ' + label"
      :disabled="value <= 1"
      @click="emit('change', value - 1)"
    >
      <Glyph name="minus" />
    </button>
    <input :value="value" type="number" min="1" :max="max" :aria-label="label" @change="update" />
    <button
      type="button"
      :aria-label="'Increase ' + label"
      :disabled="value >= max"
      @click="emit('change', value + 1)"
    >
      <Glyph name="plus" />
    </button>
  </div>
</template>
