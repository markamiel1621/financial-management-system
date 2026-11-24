import { cartIssue } from '#shared/demo/cart'
export function useCart() {
  const { model } = useFms()
  const rows = computed(() =>
    model.value.cart.map((line) => ({
      line,
      item: model.value.catalog.find((item) => item.id === line.itemId),
    })),
  )
  const total = computed(() =>
    rows.value.reduce((sum, { item, line }) => sum + (item?.price ?? 0) * line.quantity, 0),
  )
  const issue = computed(() => cartIssue(model.value))
  return { rows, total, issue }
}
