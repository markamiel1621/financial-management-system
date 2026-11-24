<script setup lang="ts">
import { demoTime } from '#shared/demo/clock'
import { personas, roleNames } from '#shared/config'
import { staffLinks } from '#shared/navigation'
import {
  approvedForWork,
  awaitingReview,
  dateLabel,
  financeCleared,
  fulfillmentStatus,
  money,
  nextAction,
  orderTotal,
  timeLabel,
  paymentStatus,
} from '#shared/orders'
import { roleDetails } from '#shared/roles'
import type { Order } from '#shared/types'

const route = useRoute()
const { visibleOrders, role, model } = useFms()
const section = computed(() => route.params.section as string)
const title = computed(() => staffLinks.find((link) => link.to === route.path)?.label)
const descriptions: Record<string, string> = {
  review: 'Review requests assigned to your office.',
  payments: 'Verify offline collections and office allocations.',
  fulfillment: 'Track assigned order lines and record handover evidence.',
  catalog: 'Maintain sample offerings and future checkout prices.',
  reports: 'Review financial and fulfillment figures for your assigned office.',
  audit: 'Inspect the chronological record of order and catalog changes.',
  administration: 'View sample accounts, office assignments, and role permissions.',
}
const search = ref('')
const readyOnly = ref(false)
watch(section, () => {
  search.value = ''
  readyOnly.value = false
})
const workReady = (order: Order) => approvedForWork(order) && financeCleared(order)
const queue = computed(() =>
  visibleOrders.value.filter((order) => {
    if (
      !(order.id + ' ' + order.lines.map((line) => line.title).join(' '))
        .toLowerCase()
        .includes(search.value.toLowerCase())
    )
      return false
    if (section.value === 'review') return awaitingReview(order)
    if (section.value === 'payments')
      return approvedForWork(order) && order.funding !== 'free' && !financeCleared(order)
    return approvedForWork(order) && (!readyOnly.value || workReady(order))
  }),
)
const audit = computed(() =>
  [
    ...visibleOrders.value.flatMap((order) =>
      order.events.map((event) => ({ ...event, record: order.id })),
    ),
    ...(role.value === 'admin'
      ? model.value.audit.map((event) => ({ ...event, record: 'Catalog' }))
      : []),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
)
function actionLabel(order: Order) {
  if (section.value === 'review')
    return order.status === 'Submitted' ? 'Start review' : 'Review request'
  if (section.value === 'payments')
    return order.funding === 'internal' ? 'Review allocation' : 'Review collection'
  return workReady(order) ? 'Open fulfillment' : 'View finance hold'
}
const latest = computed(() => demoTime(model.value))
function age(created: string) {
  const days = Math.max(0, Math.floor((latest.value - Date.parse(created)) / 86400000))
  return days ? days + (days === 1 ? ' day' : ' days') : 'Today'
}
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">{{ role && roleNames[role] }} workspace</p>
        <h1>{{ title }}</h1>
        <p class="lede">{{ descriptions[section] }}</p>
      </div>
    </div>
    <CatalogEditor v-if="section === 'catalog'" />
    <ReportSummary v-else-if="section === 'reports'" />
    <section v-else-if="section === 'administration'" class="panel">
      <div class="panel-head">
        <h2>Account directory</h2>
        <UBadge color="neutral" variant="subtle">Demo assignments</UBadge>
      </div>
      <div v-for="account in personas" :key="account.id" class="directory-row">
        <UAvatar :text="account.initials" color="primary" />
        <div>
          <h3>{{ account.name }}</h3>
          <small>{{ account.id }} · {{ account.office }}</small>
        </div>
        <div>
          <strong>{{ roleNames[account.role] }}</strong>
          <p>{{ roleDetails[account.role].description }}</p>
        </div>
      </div>
    </section>
    <section v-else-if="section === 'audit'" class="panel">
      <div class="panel-head">
        <h2>Event history</h2>
        <UBadge color="neutral" variant="subtle">{{ audit.length }} events</UBadge>
      </div>
      <div v-for="event in audit" :key="event.id" class="audit-row">
        <span class="icon-box slate"><Glyph name="history" /></span>
        <div>
          <strong>{{ event.title }}</strong>
          <p>{{ event.record }} · {{ event.actor }}</p>
          <small>{{ event.note }}</small>
        </div>
        <small>{{ dateLabel(event.at) }} · {{ timeLabel(event.at) }}</small>
      </div>
    </section>
    <section v-else class="panel">
      <div class="filter-bar inset">
        <UInput
          v-model="search"
          type="search"
          class="search-field"
          icon="i-lucide-search"
          placeholder="Search orders or items"
          aria-label="Search queue"
        />
        <UCheckbox
          v-if="section === 'fulfillment'"
          v-model="readyOnly"
          label="Ready to work only"
        />
        <UBadge color="neutral" variant="subtle">{{ queue.length }} orders</UBadge>
      </div>
      <article v-for="order in queue" :key="order.id" class="queue-row">
        <div class="queue-heading">
          <div>
            <NuxtLink :to="'/orders/' + order.id" class="order-id">{{ order.id }}</NuxtLink>
            <h3>{{ order.lines.map((line) => line.title).join(', ') }}</h3>
            <small>
              {{ personas.employee.name }} · {{ order.office }} · {{ age(order.createdAt) }}
            </small>
          </div>
          <strong>{{ money(orderTotal(order)) }}</strong>
        </div>
        <div class="queue-states">
          <span>
            Order
            <StateBadge :value="order.status" />
          </span>
          <span>
            Approval
            <StateBadge :value="order.approval" />
          </span>
          <span>
            Payment
            <StateBadge :value="paymentStatus(order)" />
          </span>
          <span>
            Fulfillment
            <StateBadge :value="fulfillmentStatus(order)" />
          </span>
        </div>
        <div class="queue-footer">
          <p>{{ nextAction(order) }}</p>
          <UButton color="neutral" variant="outline" size="sm" :to="'/orders/' + order.id">
            {{ actionLabel(order) }}
          </UButton>
        </div>
      </article>
      <EmptyState
        v-if="!queue.length"
        title="This queue is clear"
        text="Orders that match these conditions will appear here."
        icon="clipboard-check"
      />
    </section>
  </div>
</template>
