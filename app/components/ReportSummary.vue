<script setup lang="ts">
import { dateLabel, money, orderTotal, verifiedTotal, fulfillmentStatus } from '#shared/orders'
import { settings } from '#shared/config'
const { visibleOrders, model } = useFms()
const after = ref('')
const before = ref('')
const offering = ref('')
const status = ref('')
const office = ref('')
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
    <section class="panel form-card">
      <h2>Report filters</h2>
      <div class="report-filters">
        <label class="field">
          From
          <input v-model="after" type="date" :max="before || undefined" />
        </label>
        <label class="field">
          To
          <input v-model="before" type="date" :min="after || undefined" />
        </label>
        <label class="field">
          Office
          <select v-model="office">
            <option value="">All assigned offices</option>
            <option>{{ settings.office }}</option>
          </select>
        </label>
        <label class="field">
          Offering
          <select v-model="offering">
            <option value="">All offerings</option>
            <option v-for="item in model.catalog" :key="item.id" :value="item.id">
              {{ item.title }}
            </option>
          </select>
        </label>
        <label class="field">
          Order status
          <select v-model="status">
            <option value="">All statuses</option>
            <option
              v-for="value in [...new Set(visibleOrders.map((order) => order.status))]"
              :key="value"
            >
              {{ value }}
            </option>
          </select>
        </label>
      </div>
    </section>
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
