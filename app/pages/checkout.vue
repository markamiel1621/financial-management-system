<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { z } from 'zod'
import { nextDemoTime } from '#shared/demo/clock'
import { fundingLabels, settings } from '#shared/config'
import { placeOrder } from '#shared/demo/cart'
import { money } from '#shared/orders'
import { checkoutSchema, purposeFormSchema } from '#shared/validation'

const { model, person, change } = useFms()
const { rows, total, issue } = useCart()
const appName = useAppName()
const step = ref(1)
const state = reactive({ purpose: '', acknowledged: false })
const busy = ref(false)
const error = ref('')
const revision = model.value.cartRevision
const steps = [{ title: 'Request details' }, { title: 'Processing' }, { title: 'Review & place' }]

function showStep(next: number) {
  error.value = ''
  step.value = next
}
async function place({ data }: FormSubmitEvent<z.output<typeof checkoutSchema>>) {
  if (busy.value) return
  error.value = ''
  busy.value = true
  try {
    const result = change((draft) =>
      placeOrder(draft, revision, data.purpose, data.acknowledged, nextDemoTime(draft), appName),
    )
    if (result.ok) {
      await navigateTo(
        { path: '/orders/' + result.value, query: { placed: '1' } },
        { replace: true },
      )
    } else {
      error.value = result.error
    }
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="page">
    <UButton to="/cart" variant="link" class="self-start px-0" icon="i-lucide-chevron-left">
      My cart
    </UButton>
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>Checkout</h1>
      </div>
    </div>
    <div v-if="issue && !busy" class="panel">
      <EmptyState title="Review your cart" :text="issue">
        <UButton to="/cart">Open cart</UButton>
      </EmptyState>
    </div>
    <div v-else class="detail-grid">
      <UCard as="section">
        <p class="sr-only" role="status">
          Step {{ step }} of {{ steps.length }}. {{ steps[step - 1]?.title }}
        </p>
        <UStepper :model-value="step - 1" :items="steps" size="sm" disabled aria-hidden="true" />
        <UForm
          v-if="step === 1"
          :schema="purposeFormSchema"
          :state="state"
          v-bind="formValidation"
          @submit="showStep(2)"
        >
          <h2>Request details</h2>
          <dl class="info-list">
            <div>
              <dt>Employee</dt>
              <dd>{{ person.name }} · {{ person.id }}</dd>
            </div>
            <div>
              <dt>Office</dt>
              <dd>{{ person.office }}</dd>
            </div>
          </dl>
          <UAlert
            v-for="{ item, line } in rows"
            :key="line.itemId + line.option"
            :title="item?.title"
            :description="item?.requirement"
            variant="subtle"
          />
          <UFormField name="purpose" label="Business purpose" required>
            <UTextarea
              v-model="state.purpose"
              :rows="3"
              :maxlength="500"
              placeholder="Describe what your office needs and why."
            />
          </UFormField>
          <div class="form-actions">
            <UButton type="submit">Continue</UButton>
          </div>
        </UForm>
        <template v-else-if="step === 2">
          <h2>How your order will be processed</h2>
          <div
            v-for="{ item, line } in rows"
            :key="line.itemId + line.option"
            class="processing-line"
          >
            <h3>{{ item?.title }} · {{ line.option }}</h3>
            <p>{{ item?.delivery }}</p>
            <dl class="info-list">
              <div>
                <dt>Approval</dt>
                <dd>{{ item?.review ? 'Supervisor review' : 'Accepted by policy' }}</dd>
              </div>
              <div>
                <dt>Funding</dt>
                <dd>{{ item && fundingLabels[item.funding] }}</dd>
              </div>
            </dl>
          </div>
          <div class="form-actions">
            <UButton color="neutral" variant="outline" @click="showStep(1)">Back</UButton>
            <UButton @click="showStep(3)">Continue</UButton>
          </div>
        </template>
        <UForm
          v-else
          :schema="checkoutSchema"
          :state="state"
          v-bind="formValidation"
          @submit="place"
        >
          <h2>Review and place order</h2>
          <p class="muted">{{ person.name }} · {{ person.office }}</p>
          <p class="purpose-preview">{{ state.purpose.trim() }}</p>
          <div v-for="{ item, line } in rows" :key="line.itemId + line.option" class="summary-row">
            <span>
              {{ item?.title }}
              <small>{{ line.option }} · {{ line.quantity }} × {{ money(item?.price ?? 0) }}</small>
            </span>
            <strong>{{ money(line.quantity * (item?.price ?? 0)) }}</strong>
          </div>
          <UAlert
            :title="'Order terms · ' + settings.policy"
            variant="subtle"
            description="Prices are saved at checkout. Required approvals and financial verification must clear before fulfillment. Cancellation is available before finance or fulfillment activity."
          />
          <UFormField name="acknowledged">
            <UCheckbox
              v-model="state.acknowledged"
              label="I have reviewed the order and agree to these terms."
              required
            />
          </UFormField>
          <UAlert v-if="error" color="error" variant="soft" :description="error" role="alert" />
          <div class="form-actions">
            <UButton color="neutral" variant="outline" :disabled="busy" @click="showStep(2)">
              Back
            </UButton>
            <UButton type="submit" :loading="busy">
              {{ busy ? 'Placing order…' : 'Place order' }}
            </UButton>
          </div>
        </UForm>
      </UCard>
      <UCard as="aside" class="sticky-card">
        <h2>Order summary</h2>
        <div v-for="{ line, item } in rows" :key="line.itemId + line.option" class="summary-row">
          <span>
            {{ item?.title }}
            <small>{{ line.quantity }} × {{ money(item?.price ?? 0) }}</small>
          </span>
          <strong>{{ money(line.quantity * (item?.price ?? 0)) }}</strong>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <strong>{{ money(total) }}</strong>
        </div>
      </UCard>
    </div>
  </div>
</template>
