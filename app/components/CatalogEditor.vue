<script setup lang="ts">
import { settings } from '#shared/config'
import { nextDemoTime } from '#shared/demo/clock'
import { money } from '#shared/orders'
import { editOffering } from '#shared/demo/catalog-admin'
import type { Offering } from '#shared/types'
const { model, change } = useFms()
const editing = ref('')
const price = ref(0)
const stock = ref<number | null>(null)
const published = ref(true)
function open(item: Offering) {
  editing.value = item.id
  price.value = item.price / 100
  stock.value = item.stock
  published.value = item.active
}
function save(item: Offering) {
  const value = change(
    (draft) =>
      editOffering(
        draft,
        item.id,
        { price: Math.round(price.value * 100), stock: stock.value, active: published.value },
        nextDemoTime(draft),
      ),
    'Catalog updated',
  )
  if (value.ok) editing.value = ''
}
</script>
<template>
  <section class="panel">
    <div class="panel-head">
      <h2>Catalog offerings</h2>
      <span class="meta-chip">{{ model.catalog.length }} offerings</span>
    </div>
    <article v-for="item in model.catalog" :key="item.id" class="edit-row">
      <div class="editor-heading">
        <span class="icon-box" :class="item.color"><Glyph :name="item.icon" /></span>
        <div>
          <h3>{{ item.title }}</h3>
          <small>
            {{ item.sku }} · {{ money(item.price) }} / {{ item.unit }} ·
            {{ item.active ? 'Published' : 'Unpublished' }}
          </small>
        </div>
        <button class="btn secondary small" @click="open(item)">Edit</button>
      </div>
      <form v-if="editing === item.id" class="editor-form" @submit.prevent="save(item)">
        <label class="field">
          Unit price ({{ settings.currency }})
          <input
            v-model.number="price"
            type="number"
            step="0.01"
            min="0"
            required
            :disabled="item.funding === 'free'"
          />
        </label>
        <label v-if="item.stock !== null" class="field">
          Remaining capacity
          <input v-model.number="stock" type="number" min="0" step="1" required />
        </label>
        <label class="check-label">
          <input v-model="published" type="checkbox" />
          Published
        </label>
        <div class="form-actions">
          <button class="btn primary">Save changes</button>
          <button type="button" class="btn secondary" @click="editing = ''">Cancel</button>
        </div>
      </form>
    </article>
  </section>
</template>
