<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { fundingLabels, settings } from '#shared/config'
import { createOffering, editOffering, nextItemCode } from '#shared/demo/catalog-admin'
import { nextDemoTime } from '#shared/demo/clock'
import type { Offering } from '#shared/types'
import { catalogFormSchema } from '#shared/validation'

const { item } = defineProps<{ item: Offering | null }>()
const emit = defineEmits<{ close: [] }>()
const { model, change } = useFms()
const paymentModes = Object.entries(fundingLabels).map(([value, label]) => ({ label, value }))
const itemTypes: Offering['type'][] = ['Product', 'Service']
const code = ref(item?.sku ?? '')
const state = reactive({
  title: item?.title ?? '',
  type: item?.type ?? 'Product',
  category: item?.category ?? '',
  description: item?.description ?? '',
  owner: item?.owner ?? '',
  unit: item?.unit ?? '',
  funding: item?.funding as Offering['funding'] | undefined,
  price: item ? item.price / 100 : undefined,
  stock: item?.stock,
  limit: item?.limit ?? 1,
  options: item?.options.join('\n') ?? 'Standard',
  requirement: item?.requirement ?? '',
  delivery: item?.delivery ?? '',
  review: item?.review ?? false,
  eligible: item?.eligible ?? true,
  active: item?.active ?? true,
  get sku(): string {
    return code.value.trim() || (item ? '' : nextItemCode(model.value.catalog, this.type))
  },
})
const unlimited = computed({
  get: () => state.stock === null,
  set: (enabled: boolean) => {
    state.stock = enabled ? null : undefined
  },
})
watch(
  () => state.funding,
  (mode) => {
    if (mode === 'free') state.price = 0
  },
)
watch(
  () => state.type,
  (type) => {
    if (type === 'Product' && unlimited.value) unlimited.value = false
  },
)

function validateCode() {
  return model.value.catalog.some(
    (row) => row.id !== item?.id && row.sku.toUpperCase() === state.sku.toUpperCase(),
  )
    ? [{ name: 'sku', message: 'This item code is already in use.' }]
    : []
}

function save({ data }: FormSubmitEvent<z.output<typeof catalogFormSchema>>) {
  const result = change(
    (draft) => {
      const now = nextDemoTime(draft)
      if (item) editOffering(draft, item.id, data, now)
      else createOffering(draft, data, now)
    },
    item ? 'Catalog item updated' : 'Catalog item created',
  )
  if (result.ok) emit('close')
}
</script>

<template>
  <div class="panel-head">
    <h2>{{ item ? 'Edit catalog item' : 'New catalog item' }}</h2>
  </div>
  <UForm
    :schema="catalogFormSchema"
    :state="state"
    :validate="validateCode"
    class="panel-body grid gap-6"
    v-bind="formValidation"
    @submit="save"
  >
    <fieldset class="grid gap-4 sm:grid-cols-2">
      <legend class="mb-3 font-semibold">Item details</legend>
      <UFormField name="title" label="Item name" required>
        <UInput v-model="state.title" class="w-full" autofocus />
      </UFormField>
      <UFormField name="type" label="Item type" required>
        <USelect v-model="state.type" :items="itemTypes" class="w-full" />
      </UFormField>
      <UFormField
        name="sku"
        label="Item code"
        :required="!!item"
        :description="
          item
            ? undefined
            : 'Leave blank to generate ' + nextItemCode(model.catalog, state.type) + '.'
        "
      >
        <UInput v-model="code" class="w-full" />
      </UFormField>
      <UFormField name="category" label="Category" required>
        <UInput v-model="state.category" class="w-full" />
      </UFormField>
      <UFormField name="description" label="Description" class="sm:col-span-2" required>
        <UTextarea v-model="state.description" class="w-full" :rows="2" />
      </UFormField>
    </fieldset>

    <fieldset class="grid gap-4 sm:grid-cols-2">
      <legend class="mb-3 font-semibold">Payment and quantity</legend>
      <UFormField name="funding" label="Mode of payment" required>
        <USelect
          v-model="state.funding"
          :items="paymentModes"
          placeholder="Select payment mode"
          class="w-full"
        />
      </UFormField>
      <UFormField name="price" :label="'Unit price (' + settings.currency + ')'" required>
        <UInput
          v-model.number="state.price"
          type="number"
          min="0"
          step="0.01"
          :disabled="state.funding === 'free'"
          class="w-full"
        />
      </UFormField>
      <UFormField name="unit" label="Unit" required>
        <UInput v-model="state.unit" placeholder="e.g. box, page, session" class="w-full" />
      </UFormField>
      <UFormField name="limit" label="Maximum quantity per option per order" required>
        <UInput v-model.number="state.limit" type="number" min="1" step="1" class="w-full" />
      </UFormField>
      <div class="grid content-start gap-2">
        <UFormField name="stock" label="Available quantity" :required="!unlimited">
          <UInput
            type="number"
            min="0"
            step="1"
            :model-value="state.stock ?? undefined"
            :disabled="unlimited"
            class="w-full"
            @update:model-value="state.stock = typeof $event === 'number' ? $event : undefined"
          />
        </UFormField>
        <UCheckbox
          v-if="state.type === 'Service'"
          v-model="unlimited"
          label="Unlimited service capacity"
        />
      </div>
      <UFormField
        name="options"
        label="Order options"
        description="Enter one option per line."
        required
      >
        <UTextarea v-model="state.options" class="w-full" :rows="2" />
      </UFormField>
    </fieldset>

    <fieldset class="grid gap-4 sm:grid-cols-2">
      <legend class="mb-3 font-semibold">Fulfillment and access</legend>
      <UFormField name="owner" label="Responsible office" required>
        <UInput v-model="state.owner" class="w-full" />
      </UFormField>
      <UFormField name="requirement" label="Information required from employee">
        <UInput v-model="state.requirement" class="w-full" />
      </UFormField>
      <UFormField name="delivery" label="Fulfillment instructions" class="sm:col-span-2" required>
        <UTextarea v-model="state.delivery" class="w-full" :rows="2" />
      </UFormField>
      <div class="flex flex-wrap gap-4 sm:col-span-2">
        <UCheckbox v-model="state.review" label="Requires supervisor approval" />
        <UCheckbox v-model="state.eligible" label="Available to employees in this office" />
        <UCheckbox v-model="state.active" label="Published in employee catalog" />
      </div>
    </fieldset>
    <div class="flex flex-wrap gap-2">
      <UButton type="submit">{{ item ? 'Save changes' : 'Create item' }}</UButton>
      <UButton type="button" color="neutral" variant="outline" @click="emit('close')"
        >Cancel</UButton
      >
    </div>
  </UForm>
</template>
