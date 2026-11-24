import { z } from 'zod'
import type { Funding, Offering } from './types'

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

export function catalogEditSchema(funding: Funding) {
  const price = z.number().int().nonnegative().max(100_000_000, 'Price cannot exceed 1,000,000.')
  return z.object({
    price:
      funding === 'free'
        ? price.max(0, 'A no-charge offering must keep a zero price.')
        : price.positive('Chargeable offerings require a positive price.'),
    stock: capacitySchema.nullable(),
    active: z.boolean(),
  })
}

export function catalogFormSchema(item: Offering) {
  const edit = catalogEditSchema(item.funding)
  return edit.extend({
    price: currencyToCentavos.pipe(edit.shape.price),
    stock: item.stock === null ? z.null() : capacitySchema,
  })
}
