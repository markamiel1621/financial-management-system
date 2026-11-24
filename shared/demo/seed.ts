import { personas, settings } from '../config'
import { orderTotal } from '../orders'
import type { DemoState, Order, OrderEvent, OrderStatus } from '../types'
import { sampleCatalog } from './catalog'
import { snapshot } from './cart'

interface SampleOrder {
  number: number
  item: string
  quantity: number
  day: number
  status: OrderStatus
  purpose: string
}
const examples: SampleOrder[] = [
  {
    number: 1048,
    item: 'office-supplies',
    quantity: 2,
    day: 24,
    status: 'Submitted',
    purpose: 'Supplies for the quarterly planning meeting.',
  },
  {
    number: 1047,
    item: 'printing-copying',
    quantity: 25,
    day: 23,
    status: 'Approved',
    purpose: 'Print twenty-five pages of the office handbook.',
  },
  {
    number: 1046,
    item: 'equipment-maintenance',
    quantity: 1,
    day: 21,
    status: 'In progress',
    purpose: 'Service the shared projector in Meeting Room 2.',
  },
  {
    number: 1045,
    item: 'document-processing',
    quantity: 2,
    day: 19,
    status: 'Completed',
    purpose: 'Certified copies for records filing.',
  },
  {
    number: 1044,
    item: 'office-supplies',
    quantity: 3,
    day: 18,
    status: 'Returned',
    purpose: 'Supplies for training.',
  },
  {
    number: 1043,
    item: 'equipment-maintenance',
    quantity: 1,
    day: 15,
    status: 'Under review',
    purpose: 'Inspect the printer marked AS-19.',
  },
  {
    number: 1042,
    item: 'equipment-consultation',
    quantity: 1,
    day: 12,
    status: 'Completed',
    purpose: 'Review options for connecting the meeting room display.',
  },
  {
    number: 1041,
    item: 'printing-copying',
    quantity: 10,
    day: 9,
    status: 'Completed',
    purpose: 'Print copies for the monthly team meeting.',
  },
]

function makeExample(example: SampleOrder, appName: string): Order {
  const item = sampleCatalog.find((item) => item.id === example.item)!
  const id = 'FMS-2026-' + example.number
  const at = (day: number, time: string) =>
    '2026-11-' + String(day).padStart(2, '0') + 'T' + time + ':00+08:00'
  const createdAt = at(example.day, '08:15')
  const events: OrderEvent[] = []
  function event(date: string, actor: string, title: string, note: string) {
    events.push({ id: id + '-' + (events.length + 1), at: date, actor, title, note })
  }
  const line = snapshot(item, item.options[0]!, example.quantity)
  const order: Order = {
    id,
    employeeId: personas.employee.id,
    office: settings.office,
    createdAt,
    purpose: example.purpose,
    status: example.status,
    approval: item.review ? 'Pending' : 'Not required',
    funding: item.funding,
    allocation: null,
    policy: settings.policy,
    checkoutKey: 'sample/' + id,
    checkoutPurpose: example.purpose,
    lines: [line],
    payments: [],
    events,
  }
  event(createdAt, personas.employee.name, 'Order placed', item.title + ' requested.')
  event(
    at(example.day, '08:16'),
    appName,
    item.review ? 'Sent for review' : 'Accepted by policy',
    item.review
      ? 'Assigned to ' + personas.supervisor.name + '.'
      : 'The item policy accepts this order automatically.',
  )
  if (item.review && example.status !== 'Submitted') {
    order.approval = 'Under review'
    event(
      at(example.day, '09:00'),
      personas.supervisor.name,
      'Review started',
      'The assigned supervisor opened the request.',
    )
  }
  if (example.status === 'Returned') {
    order.approval = 'Returned'
    event(
      at(example.day + 1, '09:30'),
      personas.supervisor.name,
      'Order returned',
      'Please include the training date and expected number of participants.',
    )
  }
  if (example.status === 'In progress') {
    order.approval = 'Approved'
    order.allocation = { reference: 'AS-2026-184', verifiedBy: personas.finance.name }
    event(
      at(example.day, '10:20'),
      personas.supervisor.name,
      'Order approved',
      'The office approved the service.',
    )
    event(
      at(example.day + 1, '14:10'),
      personas.finance.name,
      'Allocation verified',
      'Office budget reference AS-2026-184.',
    )
    line.status = 'In progress'
    event(
      at(23, '14:40'),
      personas.fulfillment.name,
      'Fulfillment started',
      'A technician has started the inspection.',
    )
  }
  if (example.status === 'Completed') {
    if (item.funding === 'employee') {
      order.payments.push({
        reference: 'OR-' + example.number,
        amount: orderTotal(order),
        verified: true,
        recordedBy: personas.employee.name,
        verifiedBy: personas.finance.name,
        date: createdAt,
      })
      event(
        at(example.day, '11:00'),
        personas.finance.name,
        'Payment verified',
        'Cashier receipt OR-' + example.number + ' verified.',
      )
    }
    line.fulfilled = line.quantity
    line.status = 'Fulfilled'
    event(
      at(example.day + 1, '15:30'),
      personas.fulfillment.name,
      'Order completed',
      'Handover acknowledged by ' + personas.employee.name + '.',
    )
  }
  return order
}

export function createDemo(appName = settings.name): DemoState {
  const orders = examples.map((example) => makeExample(example, appName))
  return {
    version: 1,
    role: 'employee',
    cartRevision: 1,
    cart: [],
    audit: [],
    readEvents: orders.slice(3).flatMap((order) => order.events.map((event) => event.id)),
    catalog: structuredClone(sampleCatalog),
    orders,
  }
}
