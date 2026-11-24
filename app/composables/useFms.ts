import { nextDemoTime } from '#shared/demo/clock'
import { ZodError } from 'zod'
import { personas, roleHome } from '#shared/config'
import { inScope } from '#shared/orders'
import type { DemoState, Order, Role } from '#shared/types'

export async function loadFixtures(): Promise<DemoState> {
  const embedded = document.querySelector('#folio-sample-data')?.textContent
  return embedded ? (JSON.parse(embedded) as DemoState) : await $fetch<DemoState>('/api/demo.json')
}

export function useFms() {
  const state = useState<DemoState | null>('demo')
  const model = computed(() => state.value!)
  const role = computed(() => model.value.role)
  const person = computed(() => personas[role.value ?? 'employee'])
  const visibleOrders = computed(() =>
    model.value.orders.filter((order) => inScope(order, role.value)),
  )
  const cartCount = computed(() => model.value.cart.reduce((sum, line) => sum + line.quantity, 0))
  const toast = useToast()

  // Commit a single replacement after validation so failed edits leave the session intact.
  function change<T>(operation: (draft: DemoState) => T, message?: string) {
    try {
      const draft = structuredClone(toRaw(model.value))
      const result = operation(draft)
      state.value = draft
      if (message) toast.add({ title: message, color: 'success' })
      return { ok: true, value: result } as const
    } catch (cause) {
      const error =
        cause instanceof ZodError
          ? cause.issues[0]?.message
          : cause instanceof Error
            ? cause.message
            : 'Please try again.'
      const message = error || 'Please review the form.'
      toast.add({ title: message, color: 'error' })
      return { ok: false, error: message } as const
    }
  }
  function onOrder(id: string, action: (draft: DemoState, order: Order, now: string) => void) {
    return change((draft) => {
      const order = draft.orders.find((order) => order.id === id)
      if (!order) throw new Error('This order could not be found.')
      action(draft, order, nextDemoTime(draft))
    }, 'Order updated')
  }
  async function switchRole(next: Role) {
    change((draft) => {
      draft.role = next
    })
    await navigateTo(roleHome[next])
  }
  async function reset() {
    try {
      state.value = await loadFixtures()
      await navigateTo('/')
      toast.add({ title: 'Sample workspace restored', color: 'success' })
    } catch {
      toast.add({ title: 'The sample data could not load. Please retry.', color: 'error' })
    }
  }
  return { model, role, person, visibleOrders, cartCount, change, onOrder, switchRole, reset }
}
