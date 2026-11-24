<script setup lang="ts">
import { approvedForWork, awaitingReview, needsAction } from '#shared/orders'
import { settings } from '#shared/config'
const { visibleOrders } = useFms()
const route = useRoute()
const router = useRouter()
const filters = [
  'All',
  'Awaiting review',
  'Action required',
  'In progress',
  'Completed',
  'Rejected',
  'Cancelled',
]
const selected = computed(() =>
  filters.includes(String(route.query.status)) ? String(route.query.status) : 'All',
)
const search = ref('')
const after = ref('')
const before = ref('')
const day = new Intl.DateTimeFormat('sv-SE', { timeZone: settings.timezone })
const results = computed(() =>
  visibleOrders.value.filter((order) => {
    const date = day.format(new Date(order.createdAt))
    if ((after.value && date < after.value) || (before.value && date > before.value)) return false
    const words = [order.id, ...order.lines.map((line) => line.title)].join(' ').toLowerCase()
    if (!words.includes(search.value.trim().toLowerCase())) return false
    if (selected.value === 'Awaiting review') return awaitingReview(order)
    if (selected.value === 'Action required') return needsAction(order)
    if (selected.value === 'In progress') return approvedForWork(order)
    return selected.value === 'All' || order.status === selected.value
  }),
)
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>My orders</h1>
        <p class="lede">Find an order, check its progress, or respond to a request.</p>
      </div>
      <NuxtLink to="/catalog" class="btn primary">
        <Glyph name="grid-2x2" />
        Browse catalog
      </NuxtLink>
    </div>
    <section class="panel">
      <div class="filter-bar inset">
        <label class="search-field">
          <Glyph name="search" />
          <input
            v-model="search"
            type="search"
            aria-label="Search orders"
            placeholder="Search by order or item"
          />
        </label>
        <label class="inline-field">
          From
          <input v-model="after" type="date" :max="before || undefined" />
        </label>
        <label class="inline-field">
          To
          <input v-model="before" type="date" :min="after || undefined" />
        </label>
      </div>
      <div class="tabs table-tabs">
        <button
          v-for="tab in filters"
          :key="tab"
          :class="{ active: selected === tab }"
          :aria-pressed="selected === tab"
          @click="router.replace({ query: tab === 'All' ? {} : { status: tab } })"
        >
          {{ tab }}
        </button>
      </div>
      <OrdersTable :orders="results" />
    </section>
  </div>
</template>
