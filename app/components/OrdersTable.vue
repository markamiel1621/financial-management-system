<script setup lang="ts">
import { dateLabel, money, orderTotal, paymentStatus } from '#shared/orders'
import type { Order } from '#shared/types'
withDefaults(defineProps<{ orders: Order[]; compact?: boolean }>(), { compact: false })
</script>
<template>
  <div v-if="orders.length" class="table-scroll">
    <table class="order-table" :class="{ compact }">
      <thead>
        <tr>
          <th>Order / date</th>
          <th>
            Item
            <span v-if="compact">/ total</span>
          </th>
          <th v-if="!compact">Total</th>
          <th>Order status</th>
          <th v-if="!compact">Payment</th>
          <th><span class="sr-only">Details</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>
            <NuxtLink :to="'/orders/' + order.id" class="order-id">{{ order.id }}</NuxtLink>
            <small>{{ dateLabel(order.createdAt) }}</small>
          </td>
          <td>
            <strong class="item-name">
              {{ order.lines[0]?.title }}
              <template v-if="order.lines.length > 1">+{{ order.lines.length - 1 }}</template>
            </strong>
            <small v-if="compact">{{ money(orderTotal(order)) }}</small>
          </td>
          <td v-if="!compact">{{ money(orderTotal(order)) }}</td>
          <td>
            <StateBadge :value="order.status" />
            <small v-if="compact" class="payment-meta">
              {{
                paymentStatus(order) === 'Not required' ? 'No payment due' : paymentStatus(order)
              }}
            </small>
          </td>
          <td v-if="!compact">{{ paymentStatus(order) }}</td>
          <td>
            <NuxtLink
              :to="'/orders/' + order.id"
              class="row-link"
              :aria-label="'View details for ' + order.id"
            >
              <Glyph name="chevron-right" />
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <EmptyState
    v-else
    title="No matching orders"
    text="Try another filter or browse the catalog to place an order."
  />
</template>
