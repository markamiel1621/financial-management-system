<script setup lang="ts">
import { dateLabel } from '#shared/orders'
const { activity } = useActivity()
const icons: Record<string, string> = {
  'Sent for review': 'clipboard-list',
  'Accepted by policy': 'file-check-2',
  'Fulfillment started': 'package',
  'Order completed': 'check',
  'Order returned': 'square-pen',
  'Payment verified': 'wallet',
}
const colors = ['purple', 'mint', 'peach', 'blue']
</script>
<template>
  <section class="panel feed">
    <div class="panel-head">
      <h2>Order activity</h2>
      <Glyph class="heading-icon" name="activity" />
    </div>
    <div v-if="activity.length" class="feed-list">
      <NuxtLink
        v-for="(event, index) in activity.slice(0, 4)"
        :key="event.id"
        :to="'/orders/' + event.orderId"
        class="feed-event"
      >
        <span class="feed-symbol" :class="colors[index % colors.length]">
          <Glyph :name="icons[event.title] || 'activity'" />
        </span>
        <div>
          <strong>{{ event.title }}</strong>
          <span>{{ event.orderId }}</span>
          <small>{{ dateLabel(event.at) }}</small>
        </div>
      </NuxtLink>
    </div>
    <EmptyState v-else title="No activity yet" />
    <NuxtLink to="/notifications" class="feed-footer">
      View notifications
      <Glyph name="chevron-right" />
    </NuxtLink>
  </section>
</template>
