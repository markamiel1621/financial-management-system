import { describe, expect, test } from 'bun:test'
import { createDemo } from '../shared/demo/seed'
import { acceptPrice, cartIssue, changeCart, placeOrder } from '../shared/demo/cart'
import { editOffering } from '../shared/demo/catalog-admin'
import {
  cancelOrder,
  fulfillLine,
  recordPayment,
  resubmitOrder,
  reviewOrder,
  verifyAllocation,
  verifyPayment,
} from '../shared/demo/workflow'
import {
  financeCleared,
  fulfillmentStatus,
  inScope,
  orderTotal,
  paymentStatus,
} from '../shared/orders'

const at = '2026-11-24T03:00:00Z'
const purpose = 'Prepare meeting materials.'
function checkout(itemId: string, quantity = 1) {
  const state = createDemo()
  const item = state.catalog.find((item) => item.id === itemId)!
  changeCart(state, item.id, item.options[0]!, quantity, true)
  const revision = state.cartRevision
  const id = placeOrder(state, revision, purpose, true, at)
  return { state, order: state.orders.find((order) => order.id === id)!, item, revision }
}

describe('cart and checkout', () => {
  test('merges identical options, enforces total capacity, and keeps incompatible carts', () => {
    const state = createDemo()
    state.catalog[0]!.stock = 3
    changeCart(state, 'office-supplies', 'Standard kit', 1, true)
    changeCart(state, 'office-supplies', 'Standard kit', 1, true)
    expect(state.cart).toHaveLength(1)
    expect(state.cart[0]!.quantity).toBe(2)
    expect(() => changeCart(state, 'office-supplies', 'Meeting kit', 2, true)).toThrow('capacity')
    changeCart(state, 'printing-copying', 'A4', 5, true)
    expect(() => placeOrder(state, state.cartRevision, purpose, true, at)).toThrow('funding')
    expect(state.cart).toHaveLength(2)
    expect(state.orders).toHaveLength(8)
  })
  test('blocks invalid quantities, zero stock, stale revisions and missing acknowledgement', () => {
    const state = createDemo()
    expect(() => changeCart(state, 'office-supplies', 'Standard kit', -1, true)).toThrow()
    expect(() => changeCart(state, 'archive-retrieval', 'Counter collection', 1, true)).toThrow()
    changeCart(state, 'office-supplies', 'Standard kit', 1, true)
    expect(() => placeOrder(state, 0, purpose, true, at)).toThrow('changed')
    expect(() => placeOrder(state, state.cartRevision, purpose, false, at)).toThrow()
    expect(state.catalog[0]!.stock).toBe(32)
  })
  test('reconfirms changed prices and preserves immutable snapshots on later catalog edits', () => {
    const state = createDemo()
    changeCart(state, 'office-supplies', 'Standard kit', 1, true)
    state.role = 'catalog'
    editOffering(state, 'office-supplies', { price: 12500, stock: 12, active: true }, at)
    state.role = 'employee'
    expect(cartIssue(state)).toContain('price')
    acceptPrice(state, state.cart[0]!)
    placeOrder(state, state.cartRevision, purpose, true, at)
    state.catalog[0]!.price = 20000
    expect(orderTotal(state.orders[0]!)).toBe(12500)
  })
  test('a repeated placement returns the same order and reserves only once', () => {
    const { state, order, revision, item } = checkout('office-supplies', 2)
    expect(placeOrder(state, revision, purpose, true, at)).toBe(order.id)
    expect(() => placeOrder(state, revision, 'Different purpose', true, at)).toThrow()
    expect(state.orders).toHaveLength(9)
    expect(item.stock).toBe(30)
    expect(state.cart).toEqual([])
  })
})
describe('review, finance and fulfillment', () => {
  test('partial payments and unverified evidence keep fulfillment gated', () => {
    const { state, order } = checkout('printing-copying', 10)
    expect(order.approval).toBe('Not required')
    recordPayment(state, order, 'receipt-one', 800, at)
    expect(paymentStatus(order)).toBe('Pending verification')
    expect(() => verifyPayment(state, order, 'RECEIPT-ONE', at)).toThrow()
    state.role = 'finance'
    verifyPayment(state, order, 'RECEIPT-ONE', at)
    expect(paymentStatus(order)).toBe('Partially paid')
    expect(() => verifyPayment(state, order, 'RECEIPT-ONE', at)).toThrow()
    state.role = 'fulfillment'
    expect(() => fulfillLine(state, order, 0, 'start', 'Print job', 0, at)).toThrow()
    state.role = 'finance'
    recordPayment(state, order, 'receipt-two', 1200, at)
    verifyPayment(state, order, 'RECEIPT-TWO', at)
    expect(financeCleared(order)).toBe(true)
    state.role = 'fulfillment'
    fulfillLine(state, order, 0, 'start', 'Print job started', 0, at)
    fulfillLine(state, order, 0, 'ready', 'Copies prepared', 0, at)
    fulfillLine(state, order, 0, 'handover', 'Alex collected five pages', 5, at)
    expect(fulfillmentStatus(order)).toBe('Partially fulfilled')
    fulfillLine(state, order, 0, 'handover', 'Alex collected the remaining pages', 5, at)
    expect(order.status).toBe('Completed')
  })
  test('returned order keeps its number, needs fresh review and a separate allocation', () => {
    const { state, order } = checkout('office-supplies')
    const id = order.id
    expect(() => reviewOrder(state, order, 'start', '', at)).toThrow()
    state.role = 'supervisor'
    reviewOrder(state, order, 'start', '', at)
    reviewOrder(state, order, 'return', 'Please specify the team.', at)
    state.role = 'employee'
    resubmitOrder(state, order, 'Materials for the records team.', at)
    expect(order.id).toBe(id)
    state.role = 'supervisor'
    reviewOrder(state, order, 'start', '', at)
    reviewOrder(state, order, 'approve', '', at)
    expect(paymentStatus(order)).toBe('Not required')
    expect(financeCleared(order)).toBe(false)
    state.role = 'finance'
    verifyAllocation(state, order, 'OFFICE-001', at)
    expect(financeCleared(order)).toBe(true)
    expect(order.payments).toHaveLength(0)
  })
  test('a no-charge order is ready immediately, cancellation releases reserved units once', () => {
    const free = checkout('equipment-consultation')
    expect(financeCleared(free.order)).toBe(true)
    expect(free.order.status).toBe('Approved')
    const { state, order, item } = checkout('office-supplies', 2)
    cancelOrder(state, order, 'No longer required', at)
    expect(item.stock).toBe(32)
    expect(() => cancelOrder(state, order, 'Retry', at)).toThrow()
    expect(item.stock).toBe(32)
  })
  test('read-only roles cannot act, and office and employee scopes are independent', () => {
    const { state, order } = checkout('office-supplies')
    state.role = 'admin'
    expect(() => reviewOrder(state, order, 'start', '', at)).toThrow()
    expect(inScope({ ...order, employeeId: 'OTHER' }, 'employee')).toBe(false)
    expect(inScope({ ...order, office: 'Other office' }, 'supervisor')).toBe(false)
  })
})

test('a compatible two-line order completes only after both items are handed over', () => {
  const state = createDemo()
  changeCart(state, 'printing-copying', 'A4', 5, true)
  changeCart(state, 'document-processing', 'Office copy', 1, true)
  placeOrder(state, state.cartRevision, purpose, true, at)
  const order = state.orders[0]!
  expect(orderTotal(order)).toBe(6000)
  state.role = 'finance'
  recordPayment(state, order, 'TWO-LINES', 6000, at)
  verifyPayment(state, order, 'TWO-LINES', at)
  state.role = 'fulfillment'
  for (const [index, line] of order.lines.entries()) {
    fulfillLine(state, order, index, 'start', 'Processing started', 0, at)
    fulfillLine(state, order, index, 'ready', 'Ready for collection', 0, at)
    fulfillLine(state, order, index, 'handover', 'Alex collected the output', line.quantity, at)
    expect(order.status).toBe(index === 0 ? 'In progress' : 'Completed')
  }
  expect(order.events.filter((event) => event.title === 'Order completed')).toHaveLength(1)
})

test('rejecting a reviewed request releases its reserved units and preserves its reason', () => {
  const { state, order, item } = checkout('office-supplies', 2)
  state.role = 'supervisor'
  reviewOrder(state, order, 'start', '', at)
  expect(() => reviewOrder(state, order, 'reject', '', at)).toThrow()
  reviewOrder(state, order, 'reject', 'Outside the office plan', at)
  expect(item.stock).toBe(32)
  expect(order.events.at(-1)?.note).toBe('Outside the office plan')
  expect(() => reviewOrder(state, order, 'reject', 'Repeat rejection', at)).toThrow()
})
