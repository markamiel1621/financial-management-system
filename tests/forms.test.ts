import { expect, test } from 'bun:test'
import { cartQuantityLimit, changeCart } from '../shared/demo/cart'
import { createDemo } from '../shared/demo/seed'
import {
  cartSelectionSchema,
  catalogFormSchema,
  checkoutSchema,
  fulfillmentFormSchema,
  paymentFormSchema,
  purposeFormSchema,
  reviewFormSchema,
} from '../shared/validation'

test('checkout validates each editable step and trims the saved purpose', () => {
  const state = { purpose: '    ', acknowledged: false }
  expect(purposeFormSchema.safeParse(state).success).toBe(false)
  state.purpose = '  Prepare meeting materials.  '
  expect(purposeFormSchema.parse(state).purpose).toBe('Prepare meeting materials.')
  expect(checkoutSchema.safeParse(state).success).toBe(false)
  expect(checkoutSchema.parse({ ...state, acknowledged: true }).acknowledged).toBe(true)
})

test('cart limits account for quantities already held across options', () => {
  const state = createDemo()
  const item = state.catalog.find((item) => item.id === 'office-supplies')!
  item.stock = 4
  changeCart(state, item.id, 'Standard kit', 2, true)
  changeCart(state, item.id, 'Meeting kit', 1, true)
  const max = cartQuantityLimit(state, item, 'Standard kit', true)
  expect(max).toBe(1)
  expect(cartQuantityLimit(state, item, 'Standard kit')).toBe(3)
  const schema = cartSelectionSchema(item.options, max)
  expect(schema.safeParse({ option: 'Standard kit', quantity: 2 }).success).toBe(false)
  expect(schema.safeParse({ option: 'Removed option', quantity: 1 }).success).toBe(false)
})

test('payment fields enforce centavo precision and the outstanding balance', () => {
  const schema = paymentFormSchema(207)
  expect(schema.parse({ reference: '  PAY-07  ', amount: 2.07 })).toEqual({
    reference: 'PAY-07',
    amount: 207,
  })
  for (const amount of [0, 2.08, 0.011, '', undefined]) {
    expect(schema.safeParse({ reference: 'PAY-07', amount }).success).toBe(false)
  }
})

test('catalog editing distinguishes empty capacity, zero capacity and an unlimited offering', () => {
  const { catalog } = createDemo()
  const limited = catalogFormSchema(catalog.find((item) => item.id === 'office-supplies')!)
  const edit = { price: 19.99, stock: 0, active: false }
  expect(limited.parse(edit)).toEqual({ ...edit, price: 1999 })
  for (const stock of [undefined, null, '', -1, 0.5]) {
    expect(limited.safeParse({ ...edit, stock }).success).toBe(false)
  }
  expect(limited.safeParse({ ...edit, price: 0 }).success).toBe(false)
  const free = catalogFormSchema(
    catalog.find((item) => item.funding === 'free' && item.stock === null)!,
  )
  expect(free.parse({ ...edit, price: 0, stock: null }).stock).toBeNull()
  expect(free.safeParse({ ...edit, price: 0.01, stock: null }).success).toBe(false)
})

test('review and fulfillment validate only the fields required by the selected action', () => {
  expect(reviewFormSchema.safeParse({ decision: 'approve', reason: '' }).success).toBe(true)
  for (const decision of ['return', 'reject']) {
    expect(reviewFormSchema.safeParse({ decision, reason: '   ' }).success).toBe(false)
    expect(reviewFormSchema.parse({ decision, reason: '  Missing office  ' }).reason).toBe(
      'Missing office',
    )
  }
  expect(fulfillmentFormSchema().safeParse({ evidence: 'Started work' }).success).toBe(true)
  const handover = fulfillmentFormSchema(2)
  for (const quantity of [undefined, 0, 1.5, 3]) {
    expect(handover.safeParse({ evidence: 'Collection documented', quantity }).success).toBe(false)
  }
  expect(handover.parse({ evidence: 'Collected', quantity: 2 }).quantity).toBe(2)
})
