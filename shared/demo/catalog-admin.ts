import { personas } from '../config'
import type { DemoState, Offering } from '../types'
import { offeringSchema } from '../validation'

type ItemDetails = Omit<Offering, 'id' | 'color' | 'icon'>

function requireCatalogManager(state: DemoState) {
  if (state.role !== 'catalog') throw new Error('Only the catalog manager can manage offerings.')
}

export function nextItemCode(catalog: Offering[], type: Offering['type']) {
  const prefix = type === 'Product' ? 'PRD' : 'SVC'
  const used = new Set(catalog.map((item) => item.sku.toUpperCase()))
  let sequence = 1
  let code: string
  do {
    code = prefix + '-' + String(sequence++).padStart(3, '0')
  } while (used.has(code))
  return code
}

function validateDetails(state: DemoState, input: ItemDetails, id?: string) {
  const details = offeringSchema.parse(input)
  if (state.catalog.some((item) => item.id !== id && item.sku.toUpperCase() === details.sku))
    throw new Error('This item code is already in use.')
  return details
}

function audit(state: DemoState, at: string, title: string, note: string) {
  state.audit.push({
    id: 'catalog-' + (state.audit.length + 1),
    at,
    actor: personas.catalog.name,
    title,
    note,
  })
}

export function createOffering(state: DemoState, input: ItemDetails, now: string) {
  requireCatalogManager(state)
  const details = validateDetails(state, input)
  let sequence = state.catalog.length + 1
  while (state.catalog.some((item) => item.id === 'catalog-item-' + sequence)) sequence++
  const item: Offering = {
    ...details,
    id: 'catalog-item-' + sequence,
    icon: details.type === 'Product' ? 'package' : 'wrench',
    color: details.type === 'Product' ? 'purple' : 'mint',
  }
  state.catalog.unshift(item)
  audit(state, now, 'Catalog item created', item.sku + ' · ' + item.title)
  return item.id
}

export function editOffering(
  state: DemoState,
  id: string,
  input: Partial<ItemDetails>,
  now: string,
) {
  requireCatalogManager(state)
  const item = state.catalog.find((item) => item.id === id)
  if (!item) throw new Error('Offering unavailable.')
  const details = validateDetails(state, { ...item, ...input }, id)
  const changes = (Object.keys(details) as (keyof ItemDetails)[])
    .filter((key) => JSON.stringify(item[key]) !== JSON.stringify(details[key]))
    .map((key) => key + ': ' + JSON.stringify(item[key]) + ' → ' + JSON.stringify(details[key]))
  if (!changes.length) return
  Object.assign(item, details)
  audit(state, now, 'Catalog updated', item.sku + ' · ' + changes.join('; '))
}
