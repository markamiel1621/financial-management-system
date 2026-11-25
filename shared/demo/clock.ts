import { settings } from '../config'
import type { DemoState } from '../types'

// A repeatable presentation clock. Each action advances one minute beyond the latest event.
export function demoTime(state: DemoState) {
  let latest = Date.parse(`${settings.sampleDate}`)
  for (const order of state.orders) {
    for (const event of order.events) latest = Math.max(latest, Date.parse(event.at))
  }
  for (const event of state.audit) latest = Math.max(latest, Date.parse(event.at))
  return latest
}
export const nextDemoTime = (state: DemoState) => new Date(demoTime(state) + 60_000).toISOString()
