import { settings, personas } from './config'
import type { Order, OrderLine, Role } from './types'

const priceFormat = new Intl.NumberFormat(settings.locale, {
  style: 'currency',
  currency: settings.currency,
})
export const money = (centavos: number) => priceFormat.format(centavos / 100)
export const dateLabel = (value: string, long = false) =>
  new Intl.DateTimeFormat(settings.locale, {
    day: 'numeric',
    month: long ? 'long' : 'short',
    year: 'numeric',
    timeZone: settings.timezone,
  }).format(new Date(value))
export const timeLabel = (value: string) =>
  new Intl.DateTimeFormat(settings.locale, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: settings.timezone,
  }).format(new Date(value))
export const lineTotal = (line: Pick<OrderLine, 'quantity' | 'price'>) => line.quantity * line.price
export const orderTotal = (order: Order) =>
  order.lines.reduce((sum, line) => sum + lineTotal(line), 0)
export const verifiedTotal = (order: Order) =>
  order.payments.reduce((sum, entry) => sum + (entry.verified ? entry.amount : 0), 0)
export const isTerminal = (order: Order) =>
  ['Completed', 'Rejected', 'Cancelled'].includes(order.status)
export const awaitingReview = (order: Order) => ['Submitted', 'Under review'].includes(order.status)
export function paymentStatus(order: Order) {
  if (order.funding !== 'employee') return 'Not required'
  if (verifiedTotal(order) >= orderTotal(order)) return 'Paid'
  if (order.payments.some((entry) => !entry.verified)) return 'Pending verification'
  return verifiedTotal(order) > 0 ? 'Partially paid' : 'Unpaid'
}
export function fulfillmentStatus(order: Order) {
  if (order.lines.every((line) => line.status === 'Cancelled')) return 'Cancelled'
  if (order.lines.every((line) => line.status === 'Fulfilled')) return 'Fulfilled'
  if (order.lines.some((line) => line.fulfilled > 0)) return 'Partially fulfilled'
  if (order.lines.some((line) => line.status !== 'Not started')) return 'In progress'
  return 'Not started'
}
export function financeCleared(order: Order) {
  if (order.funding === 'internal') return !!order.allocation
  return order.funding === 'free' || verifiedTotal(order) === orderTotal(order)
}
export const approvedForWork = (order: Order) =>
  order.status === 'Approved' || order.status === 'In progress'
export function readyForHandover(order: Order) {
  return approvedForWork(order) && financeCleared(order)
}
export function needsAction(order: Order) {
  return (
    order.status === 'Returned' ||
    (approvedForWork(order) &&
      order.funding === 'employee' &&
      ['Unpaid', 'Partially paid'].includes(paymentStatus(order)))
  )
}
export const canCancel = (order: Order) =>
  !isTerminal(order) &&
  !order.payments.length &&
  !order.allocation &&
  order.lines.every((line) => line.status === 'Not started')
export function nextAction(order: Order) {
  if (order.status === 'Returned') return 'Update your business purpose and resubmit for review.'
  if (order.status === 'Rejected' || order.status === 'Cancelled')
    return order.events.at(-1)?.note || 'This order is closed.'
  if (order.status === 'Completed') return 'All items have been fulfilled.'
  if (awaitingReview(order)) return 'Your supervisor will review this order.'
  if (!financeCleared(order)) {
    if (order.funding === 'internal') return 'Finance will verify the internal allocation.'
    return paymentStatus(order) === 'Pending verification'
      ? 'Finance will check your payment reference.'
      : 'Pay at the cashier and submit your payment reference.'
  }
  return 'Fulfillment staff can now record the handover.'
}
export function inScope(order: Order, role: Role | null) {
  if (!role || role === 'catalog') return false
  if (role === 'employee') return order.employeeId === personas.employee.id
  return order.office === settings.office
}
export const statusTone = (status: string) => {
  if (['Completed', 'Fulfilled', 'Paid', 'Verified', 'Ready', 'Available'].includes(status))
    return 'green'
  if (['Submitted', 'Under review', 'Pending', 'Pending verification'].includes(status))
    return 'amber'
  if (['Returned', 'Rejected', 'Unpaid', 'Partially paid'].includes(status)) return 'rose'
  if (['Approved', 'In progress', 'Partially fulfilled'].includes(status)) return 'violet'
  return 'neutral'
}
