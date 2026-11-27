import { expect, test } from 'bun:test'
import { cartQuantityLimit, changeCart } from '../shared/demo/cart'
import { createDemo } from '../shared/demo/seed'
import {
  cartSelectionSchema,
  catalogFormSchema,
  checkoutSchema,
  handoverFormSchema,
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
  const product = catalog.find((item) => item.type === 'Product')!
  const edit = { ...product, options: 'Small\nLarge', price: 19.99, stock: 0, active: false }
  const data = catalogFormSchema.parse(edit)
  expect(data.price).toBe(1999)
  expect(data.options).toEqual(['Small', 'Large'])
  for (const stock of [undefined, null, '', -1, 0.5]) {
    expect(catalogFormSchema.safeParse({ ...edit, stock }).success).toBe(false)
  }
  for (const invalid of [
    { price: 0 },
    { price: 1.001 },
    { title: ' ' },
    { funding: undefined },
    { limit: 0 },
    { options: '  ' },
  ]) {
    expect(catalogFormSchema.safeParse({ ...edit, ...invalid }).success).toBe(false)
  }
  const freeService = { ...edit, type: 'Service', funding: 'free', price: 0, stock: null }
  expect(catalogFormSchema.parse(freeService).stock).toBeNull()
  expect(catalogFormSchema.safeParse({ ...freeService, price: 0.01 }).success).toBe(false)
})

test('review and fulfillment validate only the fields required by the selected action', () => {
  expect(reviewFormSchema.safeParse({ decision: 'approve', reason: '' }).success).toBe(true)
  for (const decision of ['return', 'reject']) {
    expect(reviewFormSchema.safeParse({ decision, reason: '   ' }).success).toBe(false)
    expect(reviewFormSchema.parse({ decision, reason: '  Missing office  ' }).reason).toBe(
      'Missing office',
    )
  }
  expect(handoverFormSchema.parse({ remarks: '  Delivered  ' }).remarks).toBe('Delivered')
  expect(handoverFormSchema.parse({ remarks: ' ' }).remarks).toBe('')
  expect(handoverFormSchema.safeParse({ remarks: 'x'.repeat(501) }).success).toBe(false)
})
