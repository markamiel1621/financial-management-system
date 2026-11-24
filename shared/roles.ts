import type { Role } from './types'
export const roleDetails: Record<Role, { icon: string; color: string; description: string }> = {
  employee: {
    icon: 'user-round',
    color: 'purple',
    description: 'Browse the catalog, place orders, and track your own requests.',
  },
  supervisor: {
    icon: 'clipboard-check',
    color: 'sand',
    description: 'Review office orders and approve, return, or reject a request.',
  },
  finance: {
    icon: 'wallet',
    color: 'mint',
    description: 'Record offline collections and verify payments or allocations.',
  },
  fulfillment: {
    icon: 'package-check',
    color: 'blue',
    description: 'Prepare assigned items and record line-by-line handovers.',
  },
  catalog: {
    icon: 'store',
    color: 'peach',
    description: 'Change sample prices, available capacity, and publication.',
  },
  admin: {
    icon: 'shield-check',
    color: 'slate',
    description: 'Inspect role assignments, office reports, and audit history.',
  },
}
