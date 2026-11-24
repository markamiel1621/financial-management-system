<script setup lang="ts">
import { nextDemoTime } from '#shared/demo/clock'
import { fundingLabels, settings } from '#shared/config'
import { checkoutSchema, placeOrder, purposeSchema } from '#shared/demo/cart'
import { money } from '#shared/orders'
const { model, person, change } = useFms()
const { rows, total, issue } = useCart()
const appName = useAppName()
const step = ref(1)
const purpose = ref('')
const acknowledged = ref(false)
const busy = ref(false)
const error = ref('')
const revision = ref(model.value.cartRevision)
const steps = ['Request details', 'Processing', 'Review & place']
function next() {
  error.value = ''
  const validation = purposeSchema.safeParse(purpose.value)
  if (!validation.success) {
    error.value = validation.error.issues[0]!.message
    return
  }
  step.value++
}
function back() {
  step.value--
  error.value = ''
}
async function place() {
  if (busy.value) return
  error.value = ''
  const valid = checkoutSchema.safeParse({
    purpose: purpose.value,
    acknowledged: acknowledged.value,
  })
  if (!valid.success) {
    error.value = valid.error.issues[0]!.message
    return
  }
  busy.value = true
  const result = change((draft) =>
    placeOrder(draft, revision.value, purpose.value, acknowledged.value, nextDemoTime(draft), appName),
  )
  if (result.ok)
    await navigateTo({ path: '/orders/' + result.value, query: { placed: '1' } }, { replace: true })
  else {
    error.value = result.error
    busy.value = false
  }
}
</script>
<template>
  <div class="page">
    <NuxtLink to="/cart" class="back-link">
      <Glyph name="chevron-left" />
      My cart
    </NuxtLink>
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>Checkout</h1>
      </div>
    </div>
    <div v-if="issue && !busy" class="panel">
      <EmptyState title="Review your cart" :text="issue">
        <NuxtLink class="btn primary" to="/cart">Open cart</NuxtLink>
      </EmptyState>
    </div>
    <div v-else class="detail-grid">
      <section class="panel form-card">
        <ol class="stepper">
          <li
            v-for="(label, i) in steps"
            :key="label"
            :class="{ current: i + 1 === step, done: i + 1 < step }"
            :aria-current="i + 1 === step ? 'step' : undefined"
          >
            <span>{{ i + 1 }}</span>
            {{ label }}
          </li>
        </ol>
        <form @submit.prevent="step === 3 ? place() : next()">
          <template v-if="step === 1">
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
            <div class="notice" v-for="{ item } in rows" :key="item?.id">
              <strong>{{ item?.title }}</strong>
              <p>{{ item?.requirement }}</p>
            </div>
            <label class="field">
              Business purpose
              <textarea
                v-model="purpose"
                rows="3"
                maxlength="500"
                required
                placeholder="Describe what your office needs and why."
              />
            </label>
          </template>
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
          </template>
          <template v-else>
            <h2>Review and place order</h2>
            <p class="muted">{{ person.name }} · {{ person.office }}</p>
            <p class="purpose-preview">{{ purpose }}</p>
            <div
              v-for="{ item, line } in rows"
              :key="line.itemId + line.option"
              class="summary-row"
            >
              <span>
                {{ item?.title }}
                <small>
                  {{ line.option }} · {{ line.quantity }} × {{ money(item?.price ?? 0) }}
                </small>
              </span>
              <strong>{{ money(line.quantity * (item?.price ?? 0)) }}</strong>
            </div>
            <div class="notice">
              <strong>Order terms · {{ settings.policy }}</strong>
              <p>
                Prices are saved at checkout. Required approvals and financial verification must
                clear before fulfillment. Cancellation is available before finance or fulfillment
                activity.
              </p>
            </div>
            <label class="check-label">
              <input v-model="acknowledged" type="checkbox" />
              I have reviewed the order and agree to these terms.
            </label>
          </template>
          <p v-if="error" class="notice warning" role="alert">{{ error }}</p>
          <div class="form-actions">
            <button v-if="step > 1" type="button" class="btn secondary" @click="back">Back</button>
            <button type="submit" class="btn primary" :disabled="busy">
              {{ step === 3 ? (busy ? 'Placing order…' : 'Place order') : 'Continue' }}
            </button>
          </div>
        </form>
      </section>
      <aside class="panel form-card sticky-card">
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
      </aside>
    </div>
  </div>
</template>
