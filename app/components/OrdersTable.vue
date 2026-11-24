<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { dateLabel, money, orderTotal, paymentStatus } from '#shared/orders'
import type { Order } from '#shared/types'

const props = defineProps<{ orders: Order[]; compact?: boolean }>()
const columns: TableColumn<Order>[] = [
  { accessorKey: 'id', header: 'Order / date' },
  { id: 'item', header: () => (props.compact ? 'Item / total' : 'Item') },
  { id: 'total', header: 'Total', cell: ({ row }) => money(orderTotal(row.original)) },
  { accessorKey: 'status', header: 'Order status' },
  { id: 'payment', header: 'Payment', cell: ({ row }) => paymentStatus(row.original) },
  { id: 'details' },
]
</script>
<template>
  <UTable
    v-if="orders.length"
    :data="orders"
    :columns="columns"
    :column-visibility="{ total: !compact, payment: !compact }"
    :get-row-id="(order) => order.id"
    :ui="{
      root: 'table-scroll',
      base: compact ? 'order-table compact' : 'order-table',
      td: 'whitespace-normal',
    }"
  >
    <template #id-cell="{ row }">
      <ULink :to="'/orders/' + row.original.id" class="order-id">{{ row.original.id }}</ULink>
      <small>{{ dateLabel(row.original.createdAt) }}</small>
    </template>
    <template #item-cell="{ row }">
      <strong class="item-name">
        {{ row.original.lines[0]?.title }}
        <template v-if="row.original.lines.length > 1">
          +{{ row.original.lines.length - 1 }}
        </template>
      </strong>
      <small v-if="compact">{{ money(orderTotal(row.original)) }}</small>
    </template>
    <template #status-cell="{ row }">
      <StateBadge :value="row.original.status" />
      <small v-if="compact" class="payment-meta">
        {{
          paymentStatus(row.original) === 'Not required'
            ? 'No payment due'
            : paymentStatus(row.original)
        }}
      </small>
    </template>
    <template #details-header><span class="sr-only">Details</span></template>
    <template #details-cell="{ row }">
      <UButton
        :to="'/orders/' + row.original.id"
        icon="i-lucide-chevron-right"
        size="xs"
        color="neutral"
        variant="ghost"
        :aria-label="'View details for ' + row.original.id"
      />
    </template>
  </UTable>
  <EmptyState
    v-else
    title="No matching orders"
    text="Try another filter or browse the catalog to place an order."
  />
</template>
