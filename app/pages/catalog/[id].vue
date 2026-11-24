<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { cartSelectionSchema } from '#shared/validation'
import { fundingLabels } from '#shared/config'
import { money } from '#shared/orders'
import { cartQuantityLimit, changeCart } from '#shared/demo/cart'
const route = useRoute()
const { model, change } = useFms()
const item = computed(() =>
  model.value.catalog.find((item) => item.id === route.params.id && item.active),
)
const selection = reactive<{ option: string; quantity?: number }>({ option: '', quantity: 1 })
const added = ref(false)
watch(
  item,
  (next, old) => {
    if (next?.id !== old?.id) {
      selection.option = next?.options[0] ?? ''
      selection.quantity = 1
      added.value = false
    }
  },
  { immediate: true },
)
const limit = computed(() =>
  item.value ? cartQuantityLimit(model.value, item.value, selection.option, true) : 0,
)
watch(limit, (max) => {
  if (selection.quantity !== undefined && max > 0 && selection.quantity > max)
    selection.quantity = max
})
const schema = computed(() => cartSelectionSchema(item.value?.options ?? [], limit.value))
function add({ data }: FormSubmitEvent<z.output<ReturnType<typeof cartSelectionSchema>>>) {
  const offering = item.value
  if (!offering) return
  const result = change(
    (draft) => changeCart(draft, offering.id, data.option, data.quantity, true),
    'Added to your cart',
  )
  added.value = result.ok
}
</script>
<template>
  <div class="page">
    <UButton to="/catalog" variant="link" class="self-start px-0" icon="i-lucide-chevron-left">
      Catalog
    </UButton>
    <template v-if="item">
      <div class="page-head">
        <div>
          <p class="eyebrow">{{ item.category }}</p>
          <h1>{{ item.title }}</h1>
        </div>
        <UBadge color="neutral" variant="subtle">{{ item.sku }}</UBadge>
      </div>
      <div class="detail-grid">
        <section class="panel offering-detail">
          <CatalogArt :item="item" />
          <div class="panel-body">
            <h2>About this {{ item.type.toLowerCase() }}</h2>
            <p>{{ item.description }}</p>
            <dl class="info-list">
              <div>
                <dt>Eligibility</dt>
                <dd>
                  {{
                    item.eligible
                      ? 'Employees in the sample office'
                      : 'Restricted to eligible staff'
                  }}
                </dd>
              </div>
              <div>
                <dt>Required information</dt>
                <dd>{{ item.requirement }}</dd>
              </div>
              <div>
                <dt>Fulfillment</dt>
                <dd>{{ item.delivery }}</dd>
              </div>
              <div>
                <dt>Responsible office</dt>
                <dd>{{ item.owner }}</dd>
              </div>
              <div>
                <dt>Cancellation</dt>
                <dd>You can cancel before finance or fulfillment activity begins.</dd>
              </div>
            </dl>
          </div>
        </section>
        <UCard as="section" class="sticky-card">
          <UBadge color="neutral" variant="soft" size="sm" class="w-fit">{{ item.type }}</UBadge>
          <h2>
            {{ item.price ? money(item.price) : 'No employee charge' }}
            <small v-if="item.price" class="font-normal text-muted">/ {{ item.unit }}</small>
          </h2>
          <p class="muted">
            {{ fundingLabels[item.funding] }} ·
            {{
              item.review ? 'Supervisor approval required' : 'Automatically accepted at checkout'
            }}
          </p>
          <UForm
            :key="item.id"
            :state="selection"
            :schema="schema"
            v-bind="formValidation"
            @submit="add"
          >
            <UFormField label="Option" name="option" required>
              <USelect class="w-full" v-model="selection.option" :items="item.options" />
            </UFormField>
            <UFormField
              name="quantity"
              label="Quantity"
              required
              :help="
                'Up to ' +
                item.limit +
                ' per option. ' +
                (item.stock === null ? 'Open capacity.' : item.stock + ' available.')
              "
            >
              <QuantityInput
                v-model="selection.quantity"
                :max="limit"
                :label="item.title + ' quantity'"
              />
            </UFormField>
            <UAlert
              v-if="!item.eligible || limit < 1"
              color="warning"
              variant="soft"
              :description="
                !item.eligible
                  ? 'Your profile is ineligible for this offering.'
                  : item.stock === 0
                    ? 'This offering currently has no capacity.'
                    : 'Your cart already contains the available quantity.'
              "
            />
            <UButton
              type="submit"
              icon="i-lucide-shopping-cart"
              block
              :disabled="!item.eligible || limit < 1"
            >
              Add to cart
            </UButton>
          </UForm>
          <UButton v-if="added" to="/cart" color="neutral" variant="outline" block>
            View cart
          </UButton>
        </UCard>
      </div>
    </template>
    <div v-else class="panel">
      <EmptyState title="Offering unavailable" text="This item is no longer published." />
    </div>
  </div>
</template>
