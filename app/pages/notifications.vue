<script setup lang="ts">
import { dateLabel, timeLabel } from '#shared/orders'
const { activity, unread } = useActivity()
const { change } = useFms()
const filter = ref('all')
const tabs = computed(() => [
  { label: 'All updates', value: 'all' },
  { label: 'Unread', value: 'unread', badge: unread.value },
])
const events = computed(() =>
  activity.value.filter((event) => filter.value === 'all' || !event.read),
)
function mark(ids: string[]) {
  change((draft) => {
    draft.readEvents = [...new Set([...draft.readEvents, ...ids])]
  })
}
</script>
<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Employee workspace</p>
        <h1>Notifications</h1>
        <p class="lede">The latest update for each of your orders.</p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        :disabled="!unread"
        @click="mark(activity.map((event) => event.id))"
        icon="i-lucide-check-check"
      >
        Mark all as read
      </UButton>
    </div>
    <section class="panel">
      <UTabs
        v-model="filter"
        :items="tabs"
        class="order-tabs top-tabs"
        aria-label="Notification filters"
      >
        <template #content>
          <NuxtLink
            v-for="event in events"
            :key="event.id"
            :to="'/orders/' + event.orderId"
            class="notice-row"
            @click="mark([event.id])"
          >
            <span class="icon-box" :class="event.read ? 'slate' : 'purple'">
              <Glyph name="bell" />
            </span>
            <div>
              <h3>
                {{ event.title }}
                <i v-if="!event.read" class="unread-dot" aria-label="Unread" />
              </h3>
              <p>{{ event.orderId }} · {{ event.note }}</p>
              <small>{{ dateLabel(event.at) }} · {{ timeLabel(event.at) }}</small>
            </div>
            <Glyph name="chevron-right" />
          </NuxtLink>
          <EmptyState
            v-if="!events.length"
            title="You're all caught up"
            text="Updates from your orders will appear here."
            icon="bell"
          />
        </template>
      </UTabs>
    </section>
  </div>
</template>
