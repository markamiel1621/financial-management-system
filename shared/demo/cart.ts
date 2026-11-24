import { z } from 'zod'
import { personas, settings } from '../config'
import type { CartLine, DemoState, Offering, Order, OrderLine } from '../types'

export const purposeSchema = z
  .string()
  .trim()
  .min(5, 'Describe the business purpose in at least five characters.')
  .max(500, 'Keep the purpose under 500 characters.')
export const checkoutSchema = z.object({
  purpose: purposeSchema,
  acknowledged: z.literal(true, {
    error: 'Acknowledge the order terms before placing your order.',
  }),
})

export function requireEmployee(state: DemoState) {
  if (state.role !== 'employee') throw new Error('Open the employee workspace to use this cart.')
}

export function lineIssue(item: Offering | undefined, line: CartLine) {
  if (!item?.active || !item.eligible) return 'This item is no longer available to you.'
  if (!item.options.includes(line.option)) return 'This option is unavailable.'
  if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > item.limit)
    return 'Choose a quantity from 1 to ' + item.limit + '.'
  if (item.stock !== null && line.quantity > item.stock)
    return 'The quantity exceeds available capacity.'
  if (line.quotedPrice !== item.price)
    return 'The price has changed. Accept the current price to continue.'
  return ''
}

export function cartIssue(state: DemoState) {
  if (!state.cart.length) return 'Add an item to your cart to continue.'
  const modes = new Set<string>()
  for (const line of state.cart) {
    const item = state.catalog.find((item) => item.id === line.itemId)
    const issue = lineIssue(item, line)
    if (issue || !item) return issue
    if (item.stock !== null && unitsInCart(state, item.id) > item.stock)
      return 'Reduce the combined quantity for ' + item.title + '.'
    modes.add(item.funding)
  }
  return modes.size > 1
    ? 'These items use different funding methods. Keep one funding method per checkout.'
    : ''
}

function unitsInCart(state: DemoState, id: string) {
  return state.cart
    .filter((line) => line.itemId === id)
    .reduce((sum, line) => sum + line.quantity, 0)
}

export function changeCart(
  state: DemoState,
  itemId: string,
  option: string,
  quantity: number,
  add = false,
) {
  requireEmployee(state)
  const existing = state.cart.find((line) => line.itemId === itemId && line.option === option)
  if (!add && quantity === 0 && existing) {
    state.cart.splice(state.cart.indexOf(existing), 1)
  } else {
    const item = state.catalog.find((item) => item.id === itemId)
    if (!item) throw new Error('This item was removed from the catalog.')
    const next = add ? quantity + (existing?.quantity ?? 0) : quantity
    const candidate = {
      itemId,
      option,
      quantity: next,
      quotedPrice: existing?.quotedPrice ?? item.price,
    }
    const issue = lineIssue(item, { ...candidate, quotedPrice: item.price })
    if (issue) throw new Error(issue)
    if (
      item.stock !== null &&
      unitsInCart(state, item.id) - (existing?.quantity ?? 0) + next > item.stock
    )
      throw new Error('The combined quantity exceeds available capacity.')
    if (existing) Object.assign(existing, candidate)
    else state.cart.push(candidate)
  }
  state.cartRevision++
}

export function acceptPrice(state: DemoState, line: CartLine) {
  requireEmployee(state)
  const stored = state.cart.find((row) => row.itemId === line.itemId && row.option === line.option)
  const item = state.catalog.find((row) => row.id === line.itemId)
  if (!stored || !item?.active) throw new Error('This cart item is unavailable.')
  stored.quotedPrice = item.price
  state.cartRevision++
}

export function snapshot(item: Offering, option: string, quantity: number): OrderLine {
  return {
    itemId: item.id,
    title: item.title,
    sku: item.sku,
    unit: item.unit,
    price: item.price,
    option,
    quantity,
    delivery: item.delivery,
    fulfilled: 0,
    status: 'Not started',
  }
}

export function placeOrder(
  state: DemoState,
  revision: number,
  purpose: string,
  acknowledged: boolean,
  now: string,
  appName = settings.name,
) {
  requireEmployee(state)
  const key = personas.employee.id + '/' + revision
  const input = checkoutSchema.parse({ purpose, acknowledged })
  const previous = state.orders.find((order) => order.checkoutKey === key)
  if (previous) {
    if (previous.checkoutPurpose !== input.purpose)
      throw new Error('This checkout has already been used.')
    return previous.id
  }
  if (state.cartRevision !== revision)
    throw new Error('Your cart changed. Review the current items and try again.')
  const issue = cartIssue(state)
  if (issue) throw new Error(issue)
  const items = state.cart.map((line) => ({
    line,
    item: state.catalog.find((item) => item.id === line.itemId)!,
  }))
  const review = items.some(({ item }) => item.review)
  const year = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    timeZone: settings.timezone,
  }).format(new Date(now))
  const prefix = 'FMS-' + year + '-'
  const next =
    1 +
    Math.max(
      0,
      ...state.orders
        .filter((order) => order.id.startsWith(prefix))
        .map((order) => Number(order.id.slice(prefix.length))),
    )
  const id = prefix + String(next).padStart(4, '0')
  const order: Order = {
    id,
    createdAt: now,
    employeeId: personas.employee.id,
    office: personas.employee.office,
    purpose: input.purpose,
    funding: items[0]!.item.funding,
    approval: review ? 'Pending' : 'Not required',
    status: review ? 'Submitted' : 'Approved',
    allocation: null,
    policy: settings.policy,
    checkoutKey: key,
    checkoutPurpose: input.purpose,
    payments: [],
    lines: items.map(({ item, line }) => snapshot(item, line.option, line.quantity)),
    events: [
      {
        id: id + '-1',
        at: now,
        actor: personas.employee.name,
        title: 'Order placed',
        note: 'Checkout confirmed.',
      },
    ],
  }
  order.events.push({
    id: id + '-2',
    at: now,
    actor: appName,
    title: review ? 'Sent for review' : 'Accepted by policy',
    note: review
      ? 'Assigned to ' + personas.supervisor.name + '.'
      : 'These items do not require supervisor review.',
  })
  for (const { line, item } of items) if (item.stock !== null) item.stock -= line.quantity
  state.orders.unshift(order)
  state.cart = []
  state.cartRevision++
  return id
}
