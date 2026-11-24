<script setup lang="ts">
import { money } from '#shared/orders'
import { fundingLabels } from '#shared/config'
import { acceptPrice, changeCart, lineIssue } from '#shared/demo/cart'
import type { CartLine } from '#shared/types'
const { change } = useFms()
const { rows, total, issue } = useCart()
function update(line: CartLine, quantity: number) {
  change(
    (draft) => changeCart(draft, line.itemId, line.option, quantity),
    quantity ? 'Quantity updated' : 'Item removed',
  )
}
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>My cart</h1>
        <p class="lede">Review your selections before checkout.</p>
      </div>
      <NuxtLink class="btn secondary" to="/catalog">Continue browsing</NuxtLink>
    </div>
    <div v-if="rows.length" class="detail-grid">
      <section class="panel">
        <div class="panel-head">
          <h2>Cart items</h2>
          <span class="meta-chip">{{ rows.length }} lines</span>
        </div>
        <article v-for="{ line, item } in rows" :key="line.itemId + line.option" class="cart-row">
          <span class="icon-box" :class="item?.color">
            <Glyph :name="item?.icon || 'package'" />
          </span>
          <div class="cart-description">
            <h3>{{ item?.title || 'Unavailable offering' }}</h3>
            <p>{{ line.option }} · {{ item?.unit }}</p>
            <small>{{ item ? fundingLabels[item.funding] : '' }}</small>
            <p v-if="lineIssue(item, line)" class="error-text" role="alert">
              {{ lineIssue(item, line) }}
            </p>
            <button
              v-if="item && line.quotedPrice !== item.price"
              class="text-link"
              @click="change((draft) => acceptPrice(draft, line), 'Current price accepted')"
            >
              Accept {{ money(item.price) }}
            </button>
            <div class="cart-row-actions">
              <QuantityInput
                :value="line.quantity"
                :max="Math.min(item?.limit ?? 1, item?.stock ?? Infinity)"
                :label="(item?.title || '') + ' quantity'"
                @change="update(line, $event)"
              />
              <button
                class="icon-button"
                :aria-label="'Remove ' + item?.title"
                @click="update(line, 0)"
              >
                <Glyph name="trash-2" />
              </button>
            </div>
          </div>
          <div class="amount">
            <strong>{{ money((item?.price ?? 0) * line.quantity) }}</strong>
            <small>{{ money(item?.price ?? 0) }} each</small>
          </div>
        </article>
      </section>
      <aside class="panel form-card sticky-card">
        <h2>Order summary</h2>
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>{{ money(total) }}</strong>
        </div>
        <div class="summary-row">
          <span>Additional fees</span>
          <span>{{ money(0) }}</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <strong>{{ money(total) }}</strong>
        </div>
        <p v-if="issue" class="notice warning" role="alert">{{ issue }}</p>
        <button class="btn primary wide" :disabled="!!issue" @click="navigateTo('/checkout')">
          Proceed to checkout
        </button>
        <p class="fineprint">Available capacity is checked again when the order is placed.</p>
      </aside>
    </div>
    <div v-else class="panel">
      <EmptyState
        icon="shopping-cart"
        title="Your cart is empty"
        text="Choose a product or service from the catalog to get started."
      >
        <NuxtLink to="/catalog" class="btn primary">Browse catalog</NuxtLink>
      </EmptyState>
    </div>
  </div>
</template>
