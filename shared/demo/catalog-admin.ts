import type { z } from 'zod'
import { personas } from '../config'
import type { DemoState } from '../types'
import { catalogEditSchema } from '../validation'
export function editOffering(
  state: DemoState,
  id: string,
  input: z.input<ReturnType<typeof catalogEditSchema>>,
  now: string,
) {
  if (state.role !== 'catalog') throw new Error('Only the catalog manager can edit offerings.')
  const item = state.catalog.find((item) => item.id === id)
  if (!item) throw new Error('Offering unavailable.')
  const edit = catalogEditSchema(item.funding).parse(input)
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
