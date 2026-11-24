import { z } from 'zod'
import { personas } from '../config'
import type { DemoState } from '../types'
const editSchema = z.object({
  price: z.number().int().nonnegative().max(100_000_000),
  stock: z.number().int().nonnegative().max(1_000_000).nullable(),
  active: z.boolean(),
})
export function editOffering(
  state: DemoState,
  id: string,
  input: z.input<typeof editSchema>,
  now: string,
) {
  if (state.role !== 'catalog') throw new Error('Only the catalog manager can edit offerings.')
  const item = state.catalog.find((item) => item.id === id)
  if (!item) throw new Error('Offering unavailable.')
  const edit = editSchema.parse(input)
  if (item.funding === 'free' && edit.price !== 0)
    throw new Error('A no-charge offering must keep a zero price.')
  if (item.funding !== 'free' && edit.price === 0)
    throw new Error('Chargeable offerings require a positive price.')
  const previous = { price: item.price, stock: item.stock, active: item.active }
  Object.assign(item, edit)
  state.audit.push({
    id: 'catalog-' + (state.audit.length + 1),
    at: now,
    actor: personas.catalog.name,
    title: 'Catalog updated',
    note: item.sku + ' · ' + JSON.stringify(previous) + ' → ' + JSON.stringify(edit),
  })
}
