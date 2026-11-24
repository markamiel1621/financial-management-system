<script setup lang="ts">
import { settings } from '#shared/config'
import { approvedForWork, canCancel, financeCleared, isTerminal, orderTotal } from '#shared/orders'
import {
  cancelOrder,
  fulfillLine,
  recordPayment,
  resubmitOrder,
  reviewOrder,
  verifyAllocation,
  verifyPayment,
} from '#shared/demo/workflow'
import type { Order } from '#shared/types'

const props = defineProps<{ order: Order }>()
const { role, onOrder } = useFms()
const text = ref('')
const correction = ref(props.order.purpose)
const reference = ref('')
const amount = ref(0)
const cancellation = ref(false)
const lineIndex = ref(0)
const quantity = ref(1)
const error = ref('')
const balance = computed(
  () =>
    orderTotal(props.order) - props.order.payments.reduce((sum, entry) => sum + entry.amount, 0),
)
watch(
  balance,
  (value) => {
    amount.value = value / 100
  },
  { immediate: true },
)
const selectedLine = computed(() => props.order.lines[lineIndex.value])
const milestone = computed(() => {
  if (selectedLine.value?.status === 'Not started') return 'start'
  if (selectedLine.value?.status === 'In progress') return 'ready'
  return 'handover'
})
const milestoneLabel = {
  start: 'Start fulfillment',
  ready: 'Mark ready for handover',
  handover: 'Record handover',
}
const paymentOpen = computed(
  () =>
    (role.value === 'finance' || role.value === 'employee') &&
    approvedForWork(props.order) &&
    props.order.funding === 'employee',
)
const allocationOpen = computed(
  () =>
    role.value === 'finance' &&
    props.order.funding === 'internal' &&
    approvedForWork(props.order) &&
    !props.order.allocation,
)
const fulfillmentOpen = computed(
  () => role.value === 'fulfillment' && approvedForWork(props.order) && financeCleared(props.order),
)
const reviewOpen = computed(
  () => role.value === 'supervisor' && ['Submitted', 'Under review'].includes(props.order.status),
)
const employeeOpen = computed(
  () => role.value === 'employee' && (canCancel(props.order) || props.order.status === 'Returned'),
)
const hasActions = computed(
  () =>
    !isTerminal(props.order) &&
    (employeeOpen.value ||
      reviewOpen.value ||
      allocationOpen.value ||
      fulfillmentOpen.value ||
      (paymentOpen.value &&
        (balance.value > 0 ||
          (role.value === 'finance' && props.order.payments.some((entry) => !entry.verified))))),
)
function act(action: Parameters<typeof onOrder>[1]) {
  const result = onOrder(props.order.id, action)
  error.value = result.ok ? '' : result.error
  if (result.ok) {
    text.value = ''
    reference.value = ''
    cancellation.value = false
  }
}

function decide(decision: Parameters<typeof reviewOrder>[2]) {
  act((state, order, now) => reviewOrder(state, order, decision, text.value, now))
}
function submitCorrection() {
  act((state, order, now) => resubmitOrder(state, order, correction.value, now))
}
function submitCollection() {
  const centavos = Math.round(amount.value * 100)
  act((state, order, now) => recordPayment(state, order, reference.value, centavos, now))
}
function verifyReceipt(receipt: string) {
  act((state, order, now) => verifyPayment(state, order, receipt, now))
}
function authorizeAllocation() {
  act((state, order, now) => verifyAllocation(state, order, reference.value, now))
}
function recordMilestone() {
  act((state, order, now) =>
    fulfillLine(state, order, lineIndex.value, milestone.value, text.value, quantity.value, now),
  )
}
function confirmCancellation() {
  act((state, order, now) => cancelOrder(state, order, text.value, now))
}
</script>
<template>
  <section v-if="hasActions" class="panel form-card">
    <h2>Available actions</h2>
    <template v-if="reviewOpen">
      <button v-if="order.status === 'Submitted'" class="btn primary" @click="decide('start')">
        Start review
      </button>
      <template v-else>
        <label class="field">
          Decision remarks
          <small>Required when returning or rejecting an order.</small>
          <textarea v-model="text" rows="2" />
        </label>
        <div class="form-actions">
          <button class="btn primary" @click="decide('approve')">Approve</button>
          <button class="btn secondary" @click="decide('return')">Return for correction</button>
          <button class="btn danger" @click="decide('reject')">Reject</button>
        </div>
      </template>
    </template>
    <form
      v-if="role === 'employee' && order.status === 'Returned'"
      @submit.prevent="submitCorrection"
    >
      <div class="notice warning">{{ order.events.at(-1)?.note }}</div>
      <label class="field">
        Corrected business purpose
        <textarea v-model="correction" rows="3" required maxlength="500" />
      </label>
      <button class="btn primary">Resubmit order</button>
    </form>
    <form v-if="paymentOpen && balance > 0" @submit.prevent="submitCollection">
      <p class="muted">Use a sample cashier receipt to demonstrate offline payment.</p>
      <label class="field">
        Receipt reference
        <input v-model="reference" placeholder="e.g. DEMO-1047" required />
      </label>
      <label class="field">
        Amount ({{ settings.currency }})
        <input
          v-model.number="amount"
          type="number"
          step="0.01"
          min="0.01"
          :max="balance / 100"
          required
        />
      </label>
      <button class="btn primary">
        {{ role === 'employee' ? 'Submit payment reference' : 'Record collection' }}
      </button>
    </form>
    <template v-if="role === 'finance' && paymentOpen">
      <div
        v-for="entry in order.payments.filter((entry) => !entry.verified)"
        :key="entry.reference"
        class="summary-row"
      >
        <strong>{{ entry.reference }}</strong>
        <button class="btn secondary" @click="verifyReceipt(entry.reference)">
          Verify payment
        </button>
      </div>
    </template>
    <form v-if="allocationOpen" @submit.prevent="authorizeAllocation">
      <p class="muted">Authorize the order total against the requesting office.</p>
      <label class="field">
        Allocation reference
        <input v-model="reference" required placeholder="e.g. ADMIN-2026-42" />
      </label>
      <button class="btn primary">Verify allocation</button>
    </form>
    <form v-if="fulfillmentOpen" @submit.prevent="recordMilestone">
      <label class="field">
        Order line
        <select v-model.number="lineIndex">
          <option v-for="(line, index) in order.lines" :key="index" :value="index">
            {{ line.title }} · {{ line.option }} · {{ line.status }}
          </option>
        </select>
      </label>
      <template v-if="selectedLine && selectedLine.status !== 'Fulfilled'">
        <label class="field">
          Work, recipient or handover evidence
          <textarea v-model="text" rows="2" required maxlength="500" />
        </label>
        <label v-if="milestone === 'handover'" class="field">
          Units handed over
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            :max="selectedLine.quantity - selectedLine.fulfilled"
            required
          />
        </label>
        <button class="btn primary">{{ milestoneLabel[milestone] }}</button>
      </template>
    </form>
    <div v-if="role === 'employee' && canCancel(order)" class="cancel-section">
      <button v-if="!cancellation" class="text-link muted" @click="cancellation = true">
        Cancel this order
      </button>
      <form v-else @submit.prevent="confirmCancellation">
        <label class="field">
          Reason for cancellation
          <textarea v-model="text" required rows="2" />
        </label>
        <div class="form-actions">
          <button class="btn danger">Confirm cancellation</button>
          <button type="button" class="btn secondary" @click="cancellation = false">
            Keep order
          </button>
        </div>
      </form>
    </div>
    <p v-if="error" class="notice warning" role="alert">{{ error }}</p>
  </section>
</template>
