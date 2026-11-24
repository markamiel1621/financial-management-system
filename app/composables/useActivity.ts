export function useActivity() {
  const { model, visibleOrders } = useFms()
  const activity = computed(() =>
    visibleOrders.value
      .flatMap((order) => {
        const event = order.events.at(-1)
        return event
          ? [{ ...event, orderId: order.id, read: model.value.readEvents.includes(event.id) }]
          : []
      })
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
  )
  const unread = computed(() => activity.value.filter((event) => !event.read).length)
  return { activity, unread }
}
