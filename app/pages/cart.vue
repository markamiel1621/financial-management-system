<script setup lang="ts">
import { money } from '#shared/orders'
import { fundingLabels } from '#shared/config'
import { acceptPrice, cartQuantityLimit, changeCart, lineIssue } from '#shared/demo/cart'
import type { CartLine } from '#shared/types'
const { model, change } = useFms()
const { rows, total, issue } = useCart()
function update(line: CartLine, quantity: number | undefined) {
  if (quantity === undefined || quantity === line.quantity) return
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
      <UButton color="neutral" variant="outline" to="/catalog">Continue browsing</UButton>
    </div>
    <div v-if="rows.length" class="detail-grid">
      <section class="panel">
        <div class="panel-head">
          <h2>Cart items</h2>
          <UBadge color="neutral" variant="subtle">{{ rows.length }} lines</UBadge>
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
            <UButton
              v-if="item && line.quotedPrice !== item.price"
              variant="link"
              @click="change((draft) => acceptPrice(draft, line), 'Current price accepted')"
            >
              Accept {{ money(item.price) }}
            </UButton>
            <div class="cart-row-actions">
              <QuantityInput
                :model-value="line.quantity"
                :max="item ? cartQuantityLimit(model, item, line.option) : 0"
                :label="(item?.title || '') + ' quantity'"
                @update:model-value="update(line, $event)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                :aria-label="'Remove ' + (item?.title ?? line.itemId)"
                @click="update(line, 0)"
              />
            </div>
          </div>
          <div class="amount">
            <strong>{{ money((item?.price ?? 0) * line.quantity) }}</strong>
            <small>{{ money(item?.price ?? 0) }} each</small>
          </div>
        </article>
      </section>
      <UCard as="aside" class="sticky-card">
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
        <UAlert v-if="issue" color="warning" variant="soft" :description="issue" role="alert" />
        <UButton block :disabled="!!issue" @click="navigateTo('/checkout')">
          Proceed to checkout
        </UButton>
        <p class="fineprint">Available capacity is checked again when the order is placed.</p>
      </UCard>
    </div>
    <div v-else class="panel">
      <EmptyState
        icon="shopping-cart"
        title="Your cart is empty"
        text="Choose a product or service from the catalog to get started."
      >
        <UButton to="/catalog">Browse catalog</UButton>
      </EmptyState>
    </div>
  </div>
</template>
