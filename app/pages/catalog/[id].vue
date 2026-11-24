<script setup lang="ts">
import { fundingLabels } from '#shared/config'
import { money } from '#shared/orders'
import { changeCart } from '#shared/demo/cart'
const route = useRoute()
const { model, change } = useFms()
const item = computed(() =>
  model.value.catalog.find((item) => item.id === route.params.id && item.active),
)
const option = ref('')
const quantity = ref(1)
const added = ref(false)
watch(
  item,
  (next, old) => {
    if (next?.id !== old?.id) {
      option.value = next?.options[0] ?? ''
      quantity.value = 1
      added.value = false
    }
  },
  { immediate: true },
)
const limit = computed(() => Math.min(item.value?.limit ?? 0, item.value?.stock ?? Infinity))
function add() {
  if (!item.value) return
  const result = change(
    (state) => changeCart(state, item.value!.id, option.value, quantity.value, true),
    'Added to your cart',
  )
  added.value = result.ok
}
</script>
<template>
  <div class="page">
    <NuxtLink to="/catalog" class="back-link">
      <Glyph name="chevron-left" />
      Catalog
    </NuxtLink>
    <template v-if="item">
      <div class="page-head">
        <div>
          <p class="eyebrow">{{ item.category }}</p>
          <h1>{{ item.title }}</h1>
        </div>
        <span class="meta-chip">{{ item.sku }}</span>
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
        <section class="panel form-card sticky-card">
          <span class="type-tag">{{ item.type }}</span>
          <h2>
            {{ item.price ? money(item.price) : 'No employee charge' }}
            <small v-if="item.price">/ {{ item.unit }}</small>
          </h2>
          <p class="muted">
            {{ fundingLabels[item.funding] }} ·
            {{
              item.review ? 'Supervisor approval required' : 'Automatically accepted at checkout'
            }}
          </p>
          <label class="field">
            Option
            <select v-model="option">
              <option v-for="choice in item.options" :key="choice">{{ choice }}</option>
            </select>
          </label>
          <div class="field">
            Quantity
            <QuantityInput
              :value="quantity"
              :max="limit"
              :label="item.title + ' quantity'"
              @change="quantity = $event"
            />
            <small>
              Up to {{ item.limit }} per option.
              {{ item.stock === null ? 'Open capacity.' : item.stock + ' available.' }}
            </small>
          </div>
          <div v-if="!item.eligible || item.stock === 0" class="notice warning">
            {{
              !item.eligible
                ? 'Your profile is ineligible for this offering.'
                : 'This offering currently has no capacity.'
            }}
          </div>
          <button class="btn primary wide" :disabled="!item.eligible || limit < 1" @click="add">
            <Glyph name="shopping-cart" />
            Add to cart
          </button>
          <NuxtLink v-if="added" to="/cart" class="btn secondary wide">View cart</NuxtLink>
        </section>
      </div>
    </template>
    <div v-else class="panel">
      <EmptyState title="Offering unavailable" text="This item is no longer published." />
    </div>
  </div>
</template>
