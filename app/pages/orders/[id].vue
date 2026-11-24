<script setup lang="ts">
import { fundingLabels, roleHome } from '#shared/config'
import {
  dateLabel,
  fulfillmentStatus,
  lineTotal,
  money,
  nextAction,
  orderTotal,
  paymentStatus,
  timeLabel,
  verifiedTotal,
} from '#shared/orders'
const route = useRoute()
const { role, visibleOrders } = useFms()
const order = computed(() => visibleOrders.value.find((order) => order.id === route.params.id))
const timeline = computed(
  () =>
    order.value?.events.map((event) => ({
      title: event.title,
      date: [dateLabel(event.at), timeLabel(event.at), event.actor].join(' · '),
      description: event.note,
      icon: 'i-lucide-check',
    })) ?? [],
)
const back = computed(() =>
  role.value === 'employee' ? '/orders' : roleHome[role.value ?? 'employee'],
)
const placed = computed(
  () => !!order.value && route.query.placed === '1' && role.value === 'employee',
)
</script>
<template>
  <div class="page">
    <UButton :to="back" variant="link" class="self-start px-0" icon="i-lucide-chevron-left">
      {{ role === 'employee' ? 'My orders' : 'Staff workspace' }}
    </UButton>
    <template v-if="order">
      <UAlert
        v-if="placed"
        color="success"
        variant="subtle"
        icon="i-lucide-check-check"
        role="status"
        title="Order placed successfully"
        :description="'Your order number is ' + order.id + '.'"
      >
        <template #actions>
          <UButton :to="'/orders/' + order.id" variant="link" size="sm">View order</UButton>
          <UButton to="/catalog" variant="link" size="sm">Continue browsing</UButton>
        </template>
      </UAlert>
      <div class="page-head">
        <div>
          <p class="eyebrow">Order details</p>
          <h1>{{ order.id }}</h1>
          <p class="lede">
            Placed {{ dateLabel(order.createdAt, true) }} at {{ timeLabel(order.createdAt) }} ·
            {{ order.office }}
          </p>
        </div>
        <StateBadge :value="order.status" />
      </div>
      <div class="status-strip panel">
        <div
          v-for="field in [
            { label: 'Order', value: order.status },
            { label: 'Approval', value: order.approval },
            { label: 'Payment', value: paymentStatus(order) },
            { label: 'Fulfillment', value: fulfillmentStatus(order) },
          ]"
          :key="field.label"
        >
          <small>{{ field.label }}</small>
          <StateBadge :value="field.value" />
        </div>
      </div>
      <UAlert
        title="Next action"
        :description="nextAction(order)"
        icon="i-lucide-list-checks"
        variant="subtle"
      />
      <div class="detail-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <h2>Order items</h2>
              <UBadge color="neutral" variant="subtle">{{ order.lines.length }} lines</UBadge>
            </div>
            <div v-for="line in order.lines" :key="line.itemId + line.option" class="order-line">
              <div>
                <h3>{{ line.title }}</h3>
                <p>
                  {{ line.option }} · {{ line.quantity }} × {{ money(line.price) }} /
                  {{ line.unit }}
                </p>
                <small>{{ line.delivery }}</small>
              </div>
              <div class="amount">
                <strong>{{ money(lineTotal(line)) }}</strong>
                <small>{{ line.fulfilled }}/{{ line.quantity }} fulfilled</small>
                <StateBadge :value="line.status" />
              </div>
            </div>
            <div class="summary-total inset">
              <span>Order total</span>
              <strong>{{ money(orderTotal(order)) }}</strong>
            </div>
          </section>
          <OrderActions :key="order.id + role" :order="order" />
          <UCard as="section">
            <h2>Order timeline</h2>
            <UTimeline :items="timeline" :model-value="timeline.length - 1" />
          </UCard>
        </div>
        <aside class="stack">
          <UCard as="section">
            <h2>Funding details</h2>
            <dl class="info-list vertical">
              <div>
                <dt>Funding method</dt>
                <dd>{{ fundingLabels[order.funding] }}</dd>
              </div>
              <template v-if="order.funding === 'employee'">
                <div>
                  <dt>Verified collections</dt>
                  <dd>{{ money(verifiedTotal(order)) }}</dd>
                </div>
                <div>
                  <dt>Unpaid order amount</dt>
                  <dd>{{ money(orderTotal(order) - verifiedTotal(order)) }}</dd>
                </div>
              </template>
              <div v-if="order.funding === 'internal'">
                <dt>Allocation</dt>
                <dd>
                  {{
                    order.allocation
                      ? 'Verified · ' + order.allocation.reference
                      : 'Awaiting authorization'
                  }}
                </dd>
              </div>
              <div v-for="payment in order.payments" :key="payment.reference">
                <dt>{{ payment.reference }}</dt>
                <dd>
                  {{ money(payment.amount) }} ·
                  {{ payment.verified ? 'Verified' : 'Pending verification' }}
                </dd>
              </div>
            </dl>
          </UCard>
          <UCard as="section">
            <h2>Request details</h2>
            <dl class="info-list vertical">
              <div>
                <dt>Business purpose</dt>
                <dd>{{ order.purpose }}</dd>
              </div>
              <div>
                <dt>Applied policy</dt>
                <dd>{{ order.policy }}</dd>
              </div>
            </dl>
          </UCard>
        </aside>
      </div>
    </template>
    <div v-else class="panel">
      <EmptyState
        title="Order unavailable"
        text="This workspace does not have access to that order."
      >
        <UButton :to="back" color="neutral" variant="outline">Back to workspace</UButton>
      </EmptyState>
    </div>
  </div>
</template>
