<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { settings } from '#shared/config'
import { nextDemoTime } from '#shared/demo/clock'
import { editOffering } from '#shared/demo/catalog-admin'
import { money } from '#shared/orders'
import type { Offering } from '#shared/types'
import { catalogFormSchema } from '#shared/validation'

const { model, change } = useFms()
const editing = ref<Offering>()
const schema = computed(() => editing.value && catalogFormSchema(editing.value))
const state = reactive<{ price?: number; stock?: number | null; active: boolean }>({ active: true })

function open(item: Offering) {
  editing.value = item
  Object.assign(state, { price: item.price / 100, stock: item.stock, active: item.active })
}
function save({ data }: FormSubmitEvent<z.output<ReturnType<typeof catalogFormSchema>>>) {
  const item = editing.value
  if (!item) return
  const result = change(
    (draft) => editOffering(draft, item.id, data, nextDemoTime(draft)),
    'Catalog updated',
  )
  if (result.ok) editing.value = undefined
}
</script>
<template>
  <section class="panel">
    <div class="panel-head">
      <h2>Catalog offerings</h2>
      <UBadge color="neutral" variant="subtle">{{ model.catalog.length }} offerings</UBadge>
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
        <UButton color="neutral" variant="outline" size="sm" @click="open(item)">Edit</UButton>
      </div>
      <UForm
        v-if="editing?.id === item.id && schema"
        class="editor-form"
        :schema="schema"
        :state="state"
        v-bind="formValidation"
        @submit="save"
      >
        <UFormField name="price" :label="'Unit price (' + settings.currency + ')'" required>
          <UInput
            v-model.number="state.price"
            type="number"
            min="0"
            step="0.01"
            :disabled="item.funding === 'free'"
          />
        </UFormField>
        <UFormField v-if="item.stock !== null" name="stock" label="Remaining capacity" required>
          <UInput
            type="number"
            min="0"
            step="1"
            :model-value="state.stock ?? undefined"
            @update:model-value="state.stock = $event"
          />
        </UFormField>
        <UCheckbox v-model="state.active" label="Published" />
        <div class="form-actions">
          <UButton type="submit">Save changes</UButton>
          <UButton color="neutral" variant="outline" @click="editing = undefined">Cancel</UButton>
        </div>
      </UForm>
    </article>
  </section>
</template>
