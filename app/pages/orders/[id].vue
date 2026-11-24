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
const back = computed(() =>
  role.value === 'employee' ? '/orders' : roleHome[role.value ?? 'employee'],
)
const placed = computed(
  () => !!order.value && route.query.placed === '1' && role.value === 'employee',
)
</script>
<template>
  <div class="page">
    <NuxtLink :to="back" class="back-link">
      <Glyph name="chevron-left" />
      {{ role === 'employee' ? 'My orders' : 'Staff workspace' }}
    </NuxtLink>
    <template v-if="order">
      <div v-if="placed" class="confirmation" role="status">
        <span class="icon-box mint"><Glyph name="check-check" /></span>
        <div>
          <strong>Order placed successfully</strong>
          <p>Your order number is {{ order.id }}.</p>
        </div>
        <NuxtLink :to="'/orders/' + order.id" class="text-link">View order</NuxtLink>
        <NuxtLink to="/catalog" class="text-link">Continue browsing</NuxtLink>
      </div>
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
      <div class="next-action">
        <Glyph name="list-checks" />
        <div>
          <strong>Next action</strong>
          <p>{{ nextAction(order) }}</p>
        </div>
      </div>
      <div class="detail-grid">
        <div class="stack">
          <section class="panel">
            <div class="panel-head">
              <h2>Order items</h2>
              <span class="meta-chip">{{ order.lines.length }} lines</span>
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
          <section class="panel form-card">
            <h2>Order timeline</h2>
            <ol class="timeline">
              <li v-for="event in order.events" :key="event.id">
                <span class="timeline-node"><Glyph name="check" /></span>
                <div>
                  <strong>{{ event.title }}</strong>
                  <small>
                    {{ dateLabel(event.at) }} · {{ timeLabel(event.at) }} · {{ event.actor }}
                  </small>
                  <p>{{ event.note }}</p>
                </div>
              </li>
            </ol>
          </section>
        </div>
        <aside class="stack">
          <section class="panel form-card">
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
          </section>
          <section class="panel form-card">
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
          </section>
        </aside>
      </div>
    </template>
    <div v-else class="panel">
      <EmptyState
        title="Order unavailable"
        text="This workspace does not have access to that order."
      >
        <NuxtLink :to="back" class="btn secondary">Back to workspace</NuxtLink>
      </EmptyState>
    </div>
  </div>
</template>
