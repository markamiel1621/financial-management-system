<script setup lang="ts">
import heroImage from '~/assets/images/order-desk.jpg?inline'
import { demoTime } from '#shared/demo/clock'
import { settings } from '#shared/config'
import { awaitingReview, needsAction } from '#shared/orders'
const { visibleOrders, person, model } = useFms()
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: settings.timezone,
})
const date = computed(() => dateFormat.format(demoTime(model.value)))
const filter = ref('All orders')
const matches = computed(() =>
  visibleOrders.value.filter(
    (order) =>
      filter.value === 'All orders' ||
      (filter.value === 'Awaiting review' ? awaitingReview(order) : needsAction(order)),
  ),
)
const stats = computed(() => [
  {
    label: 'Total orders',
    value: visibleOrders.value.length,
    icon: 'shopping-bag',
    color: 'purple',
    filter: 'All',
  },
  {
    label: 'Awaiting review',
    value: visibleOrders.value.filter(awaitingReview).length,
    icon: 'clock-3',
    color: 'sand',
    filter: 'Awaiting review',
  },
  {
    label: 'Action required',
    value: visibleOrders.value.filter(needsAction).length,
    icon: 'circle-alert',
    color: 'peach',
    filter: 'Action required',
  },
  {
    label: 'Completed',
    value: visibleOrders.value.filter((order) => order.status === 'Completed').length,
    icon: 'package-check',
    color: 'mint',
    filter: 'Completed',
  },
])
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>Dashboard</h1>
      </div>
      <span class="date-chip">
        <Glyph name="calendar-days" />
        {{ date }}
      </span>
    </div>
    <section class="welcome">
      <div class="hero-contours" aria-hidden="true" />
      <img :src="heroImage" alt="" class="hero-art" />
      <div class="welcome-copy">
        <h2>Welcome back, {{ person.name.split(' ')[0] }}.</h2>
        <p>Find products and services for your office, and keep track of every order.</p>
        <UButton to="/catalog" class="btn hero-button" color="neutral" variant="solid">
          <Glyph name="grid-2x2" />
          Browse catalog
        </UButton>
      </div>
    </section>
    <div class="stats-grid">
      <NuxtLink
        v-for="stat in stats"
        :key="stat.label"
        :to="{ path: '/orders', query: { status: stat.filter } }"
        class="stat-card"
      >
        <span class="icon-box" :class="stat.color"><Glyph :name="stat.icon" /></span>
        <div class="stat-body">
          <span>{{ stat.label }}</span>
          <strong>{{ stat.value }}</strong>
        </div>
      </NuxtLink>
    </div>
    <div class="dashboard-bottom">
      <section class="panel recent">
        <div class="panel-head">
          <h2>Recent orders</h2>
          <NuxtLink to="/orders" class="text-link">View all</NuxtLink>
        </div>
        <div class="tabs table-tabs" aria-label="Recent order filters">
          <button
            v-for="tab in ['All orders', 'Awaiting review', 'Action required']"
            :key="tab"
            :class="{ active: filter === tab }"
            :aria-pressed="filter === tab"
            @click="filter = tab"
          >
            {{ tab }}
          </button>
        </div>
        <OrdersTable :orders="matches.slice(0, 5)" compact />
      </section>
      <ActivityFeed />
    </div>
  </div>
</template>
