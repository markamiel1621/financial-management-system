import type { Role } from './types'

export const employeeLinks = [
  { label: 'Dashboard', icon: 'layout-dashboard', to: '/' },
  { label: 'Catalog', icon: 'grid-2x2', to: '/catalog' },
  { label: 'My orders', icon: 'shopping-bag', to: '/orders' },
  { label: 'Notifications', icon: 'bell', to: '/notifications' },
]

export const staffLinks = [
  { label: 'Review queue', icon: 'clipboard-check', to: '/staff/review', roles: ['supervisor'] },
  {
    label: 'Fulfillment queue',
    icon: 'package-check',
    to: '/staff/fulfillment',
    roles: ['fulfillment'],
  },
  { label: 'Payment records', icon: 'wallet', to: '/staff/payments', roles: ['finance'] },
  { label: 'Catalog management', icon: 'store', to: '/staff/catalog', roles: ['catalog'] },
  {
    label: 'Reports',
    icon: 'chart-no-axes-combined',
    to: '/staff/reports',
    roles: ['admin', 'supervisor'],
  },
  { label: 'Audit log', icon: 'history', to: '/staff/audit', roles: ['admin', 'supervisor'] },
  { label: 'Administration', icon: 'settings-2', to: '/staff/administration', roles: ['admin'] },
]
export const staffNavigation = (role: Role) =>
  staffLinks.filter((link) => link.roles.includes(role))
export const supportLinks = [
  { label: 'Process guide', icon: 'workflow', to: '/resources' },
  { label: 'Profile', icon: 'user-round', to: '/profile' },
]
