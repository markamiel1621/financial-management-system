import { personas } from '../config'
import {
  approvedForWork,
  canCancel,
  financeCleared,
  inScope,
  isTerminal,
  orderTotal,
  verifiedTotal,
} from '../orders'
import type { DemoState, Order, Role } from '../types'
import {
  handoverQuantitySchema,
  paymentAmountSchema,
  purposeSchema,
  remarkSchema,
} from '../validation'
function assigned(state: DemoState, order: Order, allowed: Role[]) {
  const role = state.role
  if (!role || !allowed.includes(role) || !inScope(order, role))
    throw new Error('Select the assigned workspace for this action.')
  if (isTerminal(order)) throw new Error('This order is closed.')
  return personas[role]
}
function record(state: DemoState, order: Order, title: string, note: string, now: string) {
  order.events.push({
    id: order.id + '-' + (order.events.length + 1),
    at: now,
    actor: personas[state.role!].name,
    title,
    note,
  })
}
function release(state: DemoState, order: Order) {
  for (const line of order.lines) {
    const item = state.catalog.find((item) => item.id === line.itemId)
    if (item && item.stock !== null) item.stock += line.quantity - line.fulfilled
    line.status = 'Cancelled'
  }
}
export function reviewOrder(
  state: DemoState,
  order: Order,
  decision: 'start' | 'approve' | 'return' | 'reject',
  reason: string,
  now: string,
) {
  const actor = assigned(state, order, ['supervisor'])
  if (actor.id === order.employeeId)
    throw new Error('A different supervisor must review this order.')
  if (decision === 'start' && order.status === 'Submitted') {
    order.status = order.approval = 'Under review'
    record(state, order, 'Review started', 'Your supervisor opened the order.', now)
    return
  }
  if (order.status !== 'Under review' || decision === 'start')
    throw new Error('Start review before recording a decision.')
  const note = decision === 'approve' ? 'Approved for processing.' : remarkSchema.parse(reason)
  if (
    decision === 'approve' &&
    order.lines.some(
      (line) =>
        !state.catalog.some((item) => item.id === line.itemId && item.active && item.eligible),
    )
  )
    throw new Error('An item is unavailable or ineligible. Return the order for resolution.')
  const status = { approve: 'Approved', return: 'Returned', reject: 'Rejected' } as const
  order.status = order.approval = status[decision]
  if (decision === 'reject') release(state, order)
  record(state, order, 'Order ' + order.status.toLowerCase(), note, now)
}
export function resubmitOrder(state: DemoState, order: Order, purpose: string, now: string) {
  assigned(state, order, ['employee'])
  if (order.status !== 'Returned') throw new Error('Only returned orders can be corrected.')
  const next = purposeSchema.parse(purpose)
  const previous = order.purpose
  order.purpose = next
  order.status = 'Submitted'
  order.approval = 'Pending'
  record(
    state,
    order,
    'Correction submitted',
    'Previous purpose: ' + previous + ' · Revised purpose: ' + next,
    now,
  )
}
export function cancelOrder(state: DemoState, order: Order, reason: string, now: string) {
  assigned(state, order, ['employee'])
  if (!canCancel(order))
    throw new Error('Contact staff about cancelling an order with finance or fulfillment activity.')
  const note = remarkSchema.parse(reason)
  release(state, order)
  order.status = 'Cancelled'
  record(state, order, 'Order cancelled', note, now)
}
export function recordPayment(
  state: DemoState,
  order: Order,
  reference: string,
  amount: number,
  now: string,
) {
  const actor = assigned(state, order, ['employee', 'finance'])
  if (order.funding !== 'employee' || !approvedForWork(order))
    throw new Error('This order cannot receive an employee payment.')
  const ref = remarkSchema.parse(reference).toUpperCase()
  if (state.orders.some((row) => row.payments.some((entry) => entry.reference === ref)))
    throw new Error('This payment reference is already recorded.')
  const recorded = order.payments.reduce((sum, entry) => sum + entry.amount, 0)
  paymentAmountSchema(orderTotal(order) - recorded).parse(amount)
  order.payments.push({
    reference: ref,
    amount,
    verified: false,
    recordedBy: actor.name,
    date: now,
  })
  record(state, order, 'Payment reference submitted', ref + ' awaits finance verification.', now)
}
export function verifyPayment(state: DemoState, order: Order, reference: string, now: string) {
  const actor = assigned(state, order, ['finance'])
  const entry = order.payments.find((entry) => entry.reference === reference)
  if (
    !approvedForWork(order) ||
    order.funding !== 'employee' ||
    actor.id === order.employeeId ||
    !entry ||
    entry.verified
  )
    throw new Error('Choose an unverified payment for an approved order.')
  if (verifiedTotal(order) + entry.amount > orderTotal(order))
    throw new Error('Verification would exceed the order total.')
  entry.verified = true
  entry.verifiedBy = actor.name
  record(state, order, 'Payment verified', entry.reference + ' verified by Finance.', now)
}
export function verifyAllocation(state: DemoState, order: Order, reference: string, now: string) {
  const actor = assigned(state, order, ['finance'])
  if (order.funding !== 'internal' || order.allocation || !approvedForWork(order))
    throw new Error('This allocation cannot be verified.')
  order.allocation = { reference: remarkSchema.parse(reference), verifiedBy: actor.name }
  record(
    state,
    order,
    'Allocation verified',
    'Office allocation ' + order.allocation.reference + ' authorized.',
    now,
  )
}
export function fulfillLine(
  state: DemoState,
  order: Order,
  index: number,
  action: 'start' | 'ready' | 'handover',
  evidence: string,
  quantity: number,
  now: string,
) {
  assigned(state, order, ['fulfillment'])
  if (!approvedForWork(order) || !financeCleared(order))
    throw new Error('Approval and financial clearance are required before fulfillment.')
  const line = order.lines[index]
  if (!line || line.status === 'Fulfilled') throw new Error('Choose an open line.')
  const note = remarkSchema.parse(evidence)
  if (action === 'start' && line.status === 'Not started') line.status = 'In progress'
  else if (action === 'ready' && line.status === 'In progress') line.status = 'Ready'
  else if (action === 'handover' && line.status === 'Ready') {
    handoverQuantitySchema(line.quantity - line.fulfilled).parse(quantity)
    line.fulfilled += quantity
    if (line.fulfilled === line.quantity) line.status = 'Fulfilled'
  } else throw new Error('This milestone is unavailable for the selected line.')
  order.status = order.lines.every((line) => line.status === 'Fulfilled')
    ? 'Completed'
    : 'In progress'
  const title =
    action === 'handover'
      ? 'Handover recorded'
      : action === 'ready'
        ? 'Ready for handover'
        : 'Fulfillment started'
  record(
    state,
    order,
    title,
    line.title + ' · ' + (action === 'handover' ? quantity + ' ' + line.unit + ' · ' : '') + note,
    now,
  )
  if (order.status === 'Completed')
    record(
      state,
      order,
      'Order completed',
      'All lines fulfilled and finance conditions satisfied.',
      now,
    )
}
