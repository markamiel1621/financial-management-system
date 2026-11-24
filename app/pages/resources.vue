<script setup lang="ts">
import { fundingLabels } from '#shared/config'
import type { Funding } from '#shared/types'
const { role } = useFms()
const mode = ref<Funding>('internal')
const selected = ref(0)
const options: { value: Funding; label: string; item: string; id: string }[] = [
  {
    value: 'internal',
    label: 'Internal allocation',
    item: 'Office Supplies',
    id: 'office-supplies',
  },
  {
    value: 'employee',
    label: 'Employee payment',
    item: 'Printing and Copying',
    id: 'printing-copying',
  },
  {
    value: 'free',
    label: 'No employee charge',
    item: 'Equipment Consultation',
    id: 'equipment-consultation',
  },
]
const example = computed(() => options.find((option) => option.value === mode.value)!)
const nodes = computed(() => [
  {
    title: 'Select an offering',
    actor: 'Employee',
    icon: 'grid-2x2',
    color: 'purple',
    detail:
      'Open the catalog, choose an eligible item and option, and set a quantity. Adding it to the cart does not reserve capacity.',
  },
  {
    title: 'Place the order',
    actor: 'Employee',
    icon: 'shopping-cart',
    color: 'blue',
    detail:
      'Check the office, enter the business purpose, review terms and place the order. Compatible funding is required. The confirmation records one order number and a snapshot of each line.',
  },
  mode.value === 'internal'
    ? {
        title: 'Review the request',
        actor: 'Supervisor',
        icon: 'clipboard-check',
        color: 'sand',
        detail:
          'The assigned supervisor can approve, reject, or return the whole order. A returned order keeps its number while the employee corrects the purpose and resubmits.',
      }
    : {
        title: 'Accept by policy',
        actor: 'System',
        icon: 'badge-check',
        color: 'sand',
        detail:
          'This example does not require a supervisor. The order is accepted automatically and its approval state shows Not required.',
      },
  mode.value === 'internal'
    ? {
        title: 'Verify allocation',
        actor: 'Finance / Cashier',
        icon: 'wallet',
        color: 'peach',
        detail:
          'Finance enters an authorization reference for the office allocation. The employee owes no cash. Fulfillment unlocks when the allocation is verified.',
      }
    : mode.value === 'employee'
      ? {
          title: 'Verify payment',
          actor: 'Finance / Cashier',
          icon: 'receipt',
          color: 'peach',
          detail:
            'The employee submits a sample receipt. Finance verifies the recorded collection. Pending evidence or a partial payment keeps the fulfillment gate closed.',
        }
      : {
          title: 'Skip payment',
          actor: 'System',
          icon: 'check-check',
          color: 'peach',
          detail:
            'The order has no charge. It proceeds directly to fulfillment with a payment state of Not required.',
        },
  {
    title: 'Fulfill each line',
    actor: 'Fulfillment Staff',
    icon: 'package-check',
    color: 'purple',
    detail:
      'Start the work, mark an item ready, then record quantity and handover evidence. Partially issued lines stay open until every unit is delivered.',
  },
  {
    title: 'Complete the order',
    actor: 'System',
    icon: 'circle-check',
    color: 'mint',
    detail:
      'When every line is fulfilled and finance conditions are satisfied, the order becomes Completed. Its timeline and original prices remain visible in My orders.',
  },
])
watch(mode, () => {
  selected.value = 2
})
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Resources</p>
        <h1>Order process guide</h1>
        <p class="lede">Follow a sample order through the people and decisions involved.</p>
      </div>
    </div>
    <section class="panel guide">
      <div class="panel-head">
        <div>
          <h2>Explore a funding path</h2>
          <p class="muted">Choose an example, then select a stage for details.</p>
        </div>
        <span class="icon-box purple"><Glyph name="workflow" /></span>
      </div>
      <UTabs v-model="mode" :items="options" class="guide-tabs" aria-label="Funding path">
        <template #content>
          <div class="flow-heading">
            <div>
              <span class="eyebrow">{{ fundingLabels[mode] }}</span>
              <h3>{{ example.item }}</h3>
            </div>
            <UButton v-if="role === 'employee'" :to="'/catalog/' + example.id" variant="link">
              Open offering
            </UButton>
          </div>
          <ol class="flow-map">
            <li v-for="(node, index) in nodes" :key="node.title">
              <UButton
                color="neutral"
                variant="outline"
                :class="['flow-node', { active: selected === index }]"
                :aria-pressed="selected === index"
                @click="selected = index"
              >
                <span class="flow-top">
                  <span class="icon-box" :class="node.color"><Glyph :name="node.icon" /></span>
                  <span class="step-no">Step {{ index + 1 }}</span>
                </span>
                <strong>{{ node.title }}</strong>
                <small>{{ node.actor }}</small>
              </UButton>
            </li>
          </ol>
          <div v-if="nodes[selected]" class="flow-detail" aria-live="polite">
            <span class="icon-box" :class="nodes[selected]!.color">
              <Glyph :name="nodes[selected]!.icon" />
            </span>
            <div>
              <h3>{{ nodes[selected]!.title }}</h3>
              <p>{{ nodes[selected]!.detail }}</p>
            </div>
          </div>
        </template>
      </UTabs>
    </section>
    <UCard as="section">
      <h2>When an order needs attention</h2>
      <div class="policy-grid">
        <div>
          <h3>Returned for correction</h3>
          <p>
            Read the supervisor’s reason, update the purpose, and resubmit under the same order
            number.
          </p>
        </div>
        <div>
          <h3>Mixed funding</h3>
          <p>Place separate orders for employee-paid, internally funded, and no-charge items.</p>
        </div>
        <div>
          <h3>Cancellation</h3>
          <p>
            Cancel before finance or fulfillment begins. Staff handle later exceptions under the
            organization’s policy.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
