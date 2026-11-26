import { z } from 'zod'

export const purposeSchema = z
  .string()
  .trim()
  .min(5, 'Describe the business purpose in at least five characters.')
  .max(500, 'Use at most 500 characters for the business purpose.')

export const purposeFormSchema = z.object({ purpose: purposeSchema })
export const checkoutSchema = purposeFormSchema.extend({
  acknowledged: z.boolean().pipe(
    z.literal(true, {
      error: 'Acknowledge the order terms before placing your order.',
    }),
  ),
})

export const remarkSchema = z
  .string()
  .trim()
  .min(3, 'Enter at least three characters.')
  .max(500, 'Use at most 500 characters.')
export const reasonFormSchema = z.object({ reason: remarkSchema })
export const reviewFormSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve'), reason: z.string() }),
  reasonFormSchema.extend({ decision: z.enum(['return', 'reject']) }),
])
export const referenceFormSchema = z.object({ reference: remarkSchema })

// Forms display major currency units. Orders and catalog records store integer centavos.
const currencyToCentavos = z
  .number({ error: 'Enter a valid amount.' })
  .multipleOf(0.01, 'Use at most two decimal places.')
  .transform((value) => Math.round(value * 100))

export function paymentAmountSchema(balance: number) {
  const message = 'Enter an amount within the unrecorded balance.'
  return z.number().int(message).positive(message).max(balance, message)
}

export function paymentFormSchema(balance: number) {
  return referenceFormSchema.extend({
    amount: currencyToCentavos.pipe(paymentAmountSchema(balance)),
  })
}

function unitsSchema(max: number, message: string) {
  return z.number({ error: message }).int(message).min(1, message).max(max, message)
}

export function cartSelectionSchema(options: string[], max: number) {
  return z.object({
    option: z.string().refine((value) => options.includes(value), 'Choose an available option.'),
    quantity: unitsSchema(
      max,
      max > 0 ? 'Choose a whole quantity from 1 to ' + max + '.' : 'No more units are available.',
    ),
  })
}

export function handoverQuantitySchema(remaining: number) {
  return unitsSchema(remaining, 'Enter a whole quantity within the remaining units.')
}

export function fulfillmentFormSchema(remaining?: number) {
  return z.object({
    evidence: remarkSchema,
    quantity: remaining === undefined ? z.number().optional() : handoverQuantitySchema(remaining),
  })
}

const capacitySchema = z
  .number({ error: 'Enter the remaining capacity.' })
  .int('Capacity must be a whole number.')
  .min(0, 'Capacity cannot be negative.')
  .max(1_000_000, 'Capacity cannot exceed 1,000,000.')

const requiredText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, 'Enter ' + label + '.')

const offeringFields = z.object({
  title: requiredText('the item name'),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/, 'Use letters, numbers and single hyphens.'),
  type: z.enum(['Product', 'Service']),
  category: requiredText('a category'),
  description: requiredText('a description'),
  owner: requiredText('the responsible office'),
  requirement: z.string().trim(),
  delivery: requiredText('fulfillment instructions'),
  unit: requiredText('a unit'),
  options: z
    .array(requiredText('an option'))
    .min(1, 'Enter at least one option.')
    .refine((values) => new Set(values).size === values.length, 'Each option must be unique.'),
  funding: z.enum(['employee', 'internal', 'free'], { error: 'Choose a payment mode.' }),
  price: z.number().int().nonnegative().max(100_000_000, 'Price cannot exceed 1,000,000.'),
  stock: capacitySchema.nullable(),
  limit: unitsSchema(1_000_000, 'Enter a whole order limit from 1 to 1,000,000.'),
  review: z.boolean(),
  eligible: z.boolean(),
  active: z.boolean(),
})

export const offeringSchema = offeringFields.superRefine((item, ctx) => {
  if (item.funding === 'free' && item.price !== 0)
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message: 'A no-charge item must have a zero price.',
    })
  if (item.funding !== 'free' && item.price === 0)
    ctx.addIssue({
      code: 'custom',
      path: ['price'],
      message: 'Enter a positive price for a chargeable item.',
    })
  if (item.type === 'Product' && item.stock === null)
    ctx.addIssue({
      code: 'custom',
      path: ['stock'],
      message: 'Enter the available quantity for this product.',
    })
})

export const catalogFormSchema = offeringFields
  .extend({
    price: currencyToCentavos,
    options: z.string().transform((text) =>
      text
        .split(/\r?\n/)
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  })
  .pipe(offeringSchema)
