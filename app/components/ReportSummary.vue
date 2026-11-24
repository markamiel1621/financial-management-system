<script setup lang="ts">
import { dateLabel, money, orderTotal, verifiedTotal, fulfillmentStatus } from '#shared/orders'
import { settings } from '#shared/config'
import type { OrderStatus } from '#shared/types'
const { visibleOrders, model } = useFms()
const after = ref('')
const before = ref('')
const offering = ref<string | null>(null)
const status = ref<OrderStatus | null>(null)
const office = ref<string | null>(null)
const offices = [
  { label: 'All assigned offices', value: null },
  { label: settings.office, value: settings.office },
]
const offerings = computed(() => [
  { label: 'All offerings', value: null },
  ...model.value.catalog.map((item) => ({ label: item.title, value: item.id })),
])
const statuses = computed(() => [
  { label: 'All statuses', value: null },
  ...[...new Set(visibleOrders.value.map((order) => order.status))].map((value) => ({
    label: value,
    value,
  })),
])
const day = new Intl.DateTimeFormat('sv-SE', { timeZone: settings.timezone })
const filtered = computed(() =>
  visibleOrders.value.filter((order) => {
    const date = day.format(new Date(order.createdAt))
    return (
      (!after.value || date >= after.value) &&
      (!before.value || date <= before.value) &&
      (!office.value || order.office === office.value) &&
      (!status.value || order.status === status.value) &&
      (!offering.value || order.lines.some((line) => line.itemId === offering.value))
    )
  }),
)
const metrics = computed(() => {
  const active = filtered.value.filter((order) => !['Rejected', 'Cancelled'].includes(order.status))
  const sum = (fn: (order: (typeof active)[number]) => number) =>
    active.reduce((value, order) => value + fn(order), 0)
  return [
    { label: 'Order value', value: money(sum(orderTotal)) },
    { label: 'Verified collections', value: money(sum(verifiedTotal)) },
    {
      label: 'Outstanding employee balance',
      value: money(
        sum((order) =>
          order.funding === 'employee' ? orderTotal(order) - verifiedTotal(order) : 0,
        ),
      ),
    },
    {
      label: 'Verified allocations',
      value: money(sum((order) => (order.allocation ? orderTotal(order) : 0))),
    },
    {
      label: 'Cancelled orders',
      value: filtered.value.filter((order) => order.status === 'Cancelled').length,
    },
    {
      label: 'Fully fulfilled orders',
      value: active.filter((order) => fulfillmentStatus(order) === 'Fulfilled').length,
    },
  ]
})
</script>
<template>
  <div class="stack">
    <UCard as="section">
      <h2>Report filters</h2>
      <div class="report-filters">
        <UFormField label="From">
          <UInput v-model="after" type="date" :max="before || undefined" />
        </UFormField>
        <UFormField label="To">
          <UInput v-model="before" type="date" :min="after || undefined" />
        </UFormField>
        <UFormField label="Office">
          <USelect class="w-full" v-model="office" :items="offices" />
        </UFormField>
        <UFormField label="Offering">
          <USelect class="w-full" v-model="offering" :items="offerings" />
        </UFormField>
        <UFormField label="Order status">
          <USelect class="w-full" v-model="status" :items="statuses" />
        </UFormField>
      </div>
    </UCard>
    <div class="report-stats">
      <div v-for="metric in metrics" :key="metric.label" class="panel report-stat">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
    </div>
    <section class="panel">
      <div class="panel-head">
        <h2>Matching orders</h2>
        <small v-if="after || before">
          {{ after ? dateLabel(after + 'T12:00:00Z') : 'Start' }} –
          {{ before ? dateLabel(before + 'T12:00:00Z') : 'Present' }}
        </small>
      </div>
      <OrdersTable :orders="filtered" />
    </section>
  </div>
</template>
