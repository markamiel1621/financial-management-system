<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
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
import {
  fulfillmentFormSchema,
  paymentFormSchema,
  purposeFormSchema,
  reasonFormSchema,
  referenceFormSchema,
  reviewFormSchema,
} from '#shared/validation'

const props = defineProps<{ order: Order }>()
const { role, onOrder } = useFms()
const review = reactive<z.input<typeof reviewFormSchema>>({ decision: 'approve', reason: '' })
const correction = reactive({ purpose: props.order.purpose })
const payment = reactive<{ reference: string; amount?: number }>({ reference: '' })
const allocation = reactive({ reference: '' })
const cancellation = ref(false)
const cancellationState = reactive({ reason: '' })
const lineIndex = ref(0)
const work = reactive<{ evidence: string; quantity?: number }>({ evidence: '', quantity: 1 })
const error = ref('')
const balance = computed(
  () =>
    orderTotal(props.order) - props.order.payments.reduce((sum, entry) => sum + entry.amount, 0),
)
watch(
  balance,
  (value) => {
    payment.amount = value / 100
  },
  { immediate: true },
)
const paymentSchema = computed(() => paymentFormSchema(balance.value))
const lineChoices = computed(() =>
  props.order.lines.map((line, index) => ({
    value: index,
    label: [line.title, line.option, line.status].join(' · '),
  })),
)
const selectedLine = computed(() => props.order.lines[lineIndex.value])
const milestone = computed(() => {
  if (selectedLine.value?.status === 'Not started') return 'start'
  if (selectedLine.value?.status === 'In progress') return 'ready'
  return 'handover'
})
const remaining = computed(() =>
  selectedLine.value ? selectedLine.value.quantity - selectedLine.value.fulfilled : 0,
)
const workSchema = computed(() =>
  fulfillmentFormSchema(milestone.value === 'handover' ? remaining.value : undefined),
)
watch(lineIndex, () => {
  work.evidence = ''
  work.quantity = 1
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
  return result.ok
}
function submitReview({ data }: FormSubmitEvent<z.output<typeof reviewFormSchema>>) {
  act((state, order, now) => reviewOrder(state, order, data.decision, data.reason, now))
}
function submitCorrection({ data }: FormSubmitEvent<z.output<typeof purposeFormSchema>>) {
  act((state, order, now) => resubmitOrder(state, order, data.purpose, now))
}
function submitPayment({ data }: FormSubmitEvent<z.output<ReturnType<typeof paymentFormSchema>>>) {
  if (act((state, order, now) => recordPayment(state, order, data.reference, data.amount, now))) {
    payment.reference = ''
  }
}
function authorizeAllocation({ data }: FormSubmitEvent<z.output<typeof referenceFormSchema>>) {
  act((state, order, now) => verifyAllocation(state, order, data.reference, now))
}
function recordMilestone({
  data,
}: FormSubmitEvent<z.output<ReturnType<typeof fulfillmentFormSchema>>>) {
  if (
    act((state, order, now) =>
      fulfillLine(
        state,
        order,
        lineIndex.value,
        milestone.value,
        data.evidence,
        data.quantity ?? 0,
        now,
      ),
    )
  ) {
    work.evidence = ''
    work.quantity = 1
  }
}
function confirmCancellation({ data }: FormSubmitEvent<z.output<typeof reasonFormSchema>>) {
  act((state, order, now) => cancelOrder(state, order, data.reason, now))
}
</script>
<template>
  <UCard as="section" v-if="hasActions">
    <h2>Available actions</h2>
    <template v-if="reviewOpen">
      <UButton
        v-if="order.status === 'Submitted'"
        @click="act((state, order, now) => reviewOrder(state, order, 'start', '', now))"
      >
        Start review
      </UButton>
      <UForm
        v-else
        :schema="reviewFormSchema"
        :state="review"
        v-bind="formValidation"
        @submit="submitReview"
      >
        <UFormField
          name="reason"
          label="Decision remarks"
          help="Required when returning or rejecting an order."
        >
          <UTextarea v-model="review.reason" :rows="2" :maxlength="500" />
        </UFormField>
        <div class="form-actions">
          <UButton type="submit" @click="review.decision = 'approve'">Approve</UButton>
          <UButton
            type="submit"
            color="neutral"
            variant="outline"
            @click="review.decision = 'return'"
          >
            Return for correction
          </UButton>
          <UButton type="submit" color="error" variant="soft" @click="review.decision = 'reject'">
            Reject
          </UButton>
        </div>
      </UForm>
    </template>
    <UForm
      v-if="role === 'employee' && order.status === 'Returned'"
      :schema="purposeFormSchema"
      :state="correction"
      v-bind="formValidation"
      @submit="submitCorrection"
    >
      <UAlert color="warning" variant="soft" :description="order.events.at(-1)?.note" />
      <UFormField name="purpose" label="Corrected business purpose" required>
        <UTextarea v-model="correction.purpose" :rows="3" :maxlength="500" />
      </UFormField>
      <UButton type="submit" block>Resubmit order</UButton>
    </UForm>
    <UForm
      v-if="paymentOpen && balance > 0"
      :schema="paymentSchema"
      :state="payment"
      v-bind="formValidation"
      @submit="submitPayment"
    >
      <p class="muted">Use a sample cashier receipt to demonstrate offline payment.</p>
      <UFormField name="reference" label="Receipt reference" required>
        <UInput v-model="payment.reference" placeholder="e.g. DEMO-1047" :maxlength="500" />
      </UFormField>
      <UFormField name="amount" :label="'Amount (' + settings.currency + ')'" required>
        <UInput
          v-model.number="payment.amount"
          type="number"
          step="0.01"
          min="0.01"
          :max="balance / 100"
        />
      </UFormField>
      <UButton type="submit" block>
        {{ role === 'employee' ? 'Submit payment reference' : 'Record collection' }}
      </UButton>
    </UForm>
    <template v-if="role === 'finance' && paymentOpen">
      <div
        v-for="entry in order.payments.filter((entry) => !entry.verified)"
        :key="entry.reference"
        class="summary-row"
      >
        <strong>{{ entry.reference }}</strong>
        <UButton
          color="neutral"
          variant="outline"
          @click="act((state, order, now) => verifyPayment(state, order, entry.reference, now))"
        >
          Verify payment
        </UButton>
      </div>
    </template>
    <UForm
      v-if="allocationOpen"
      :schema="referenceFormSchema"
      :state="allocation"
      v-bind="formValidation"
      @submit="authorizeAllocation"
    >
      <p class="muted">Authorize the order total against the requesting office.</p>
      <UFormField name="reference" label="Allocation reference" required>
        <UInput v-model="allocation.reference" placeholder="e.g. ADMIN-2026-42" :maxlength="500" />
      </UFormField>
      <UButton type="submit" block>Verify allocation</UButton>
    </UForm>
    <template v-if="fulfillmentOpen">
      <UFormField label="Order line">
        <USelect class="w-full" v-model="lineIndex" :items="lineChoices" />
      </UFormField>
      <UForm
        v-if="selectedLine && selectedLine.status !== 'Fulfilled'"
        :key="lineIndex + milestone"
        :schema="workSchema"
        :state="work"
        v-bind="formValidation"
        @submit="recordMilestone"
      >
        <UFormField name="evidence" label="Work, recipient or handover evidence" required>
          <UTextarea v-model="work.evidence" :rows="2" :maxlength="500" />
        </UFormField>
        <UFormField
          v-if="milestone === 'handover'"
          name="quantity"
          label="Units handed over"
          required
        >
          <UInput v-model.number="work.quantity" type="number" min="1" step="1" :max="remaining" />
        </UFormField>
        <UButton type="submit" block>{{ milestoneLabel[milestone] }}</UButton>
      </UForm>
    </template>
    <div v-if="role === 'employee' && canCancel(order)" class="cancel-section">
      <UButton v-if="!cancellation" color="neutral" variant="link" @click="cancellation = true">
        Cancel this order
      </UButton>
      <UForm
        v-else
        :schema="reasonFormSchema"
        :state="cancellationState"
        v-bind="formValidation"
        @submit="confirmCancellation"
      >
        <UFormField name="reason" label="Reason for cancellation" required>
          <UTextarea v-model="cancellationState.reason" :rows="2" :maxlength="500" />
        </UFormField>
        <div class="form-actions">
          <UButton type="submit" color="error" variant="soft">Confirm cancellation</UButton>
          <UButton color="neutral" variant="outline" @click="cancellation = false">
            Keep order
          </UButton>
        </div>
      </UForm>
    </div>
    <UAlert v-if="error" color="error" variant="soft" :description="error" role="alert" />
  </UCard>
</template>
