import { personas, settings } from '#shared/config'
import type { DemoState } from '#shared/types'

export default defineNuxtPlugin(async () => {
  const model = useState<DemoState | null>('demo', () => null)
  const issue = useState('startup-error', () => '')
  let saved: string | null = null
  try {
    saved = localStorage.getItem(settings.storageKey)
  } catch {
    /* Storage is optional. */
  }
  if (saved) {
    try {
      const session = JSON.parse(saved) as DemoState
      if (
        session.version === 1 &&
        (session.role === null || Object.hasOwn(personas, session.role)) &&
        Number.isInteger(session.cartRevision) &&
        Array.isArray(session.catalog) &&
        Array.isArray(session.orders) &&
        Array.isArray(session.cart) &&
        Array.isArray(session.audit)
      )
        model.value = session
    } catch {
      /* A corrupt or old snapshot is replaced with the sample records. */
    }
  }
  try {
    if (!model.value) model.value = await loadFixtures()
  } catch {
    issue.value = 'The sample workspace could not load. Please retry.'
  }
  watch(
    model,
    (value) => {
      if (!value) return
      try {
        localStorage.setItem(settings.storageKey, JSON.stringify(value))
      } catch {
        /* Keep the session usable in memory. */
      }
    },
    { flush: 'sync' },
  )
})
