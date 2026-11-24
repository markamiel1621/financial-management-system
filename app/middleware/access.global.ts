import { roleHome } from '#shared/config'
import { staffLinks } from '#shared/navigation'
import type { DemoState } from '#shared/types'

export default defineNuxtRouteMiddleware((to) => {
  const state = useState<DemoState | null>('demo').value
  if (!state || import.meta.server) return
  const role = state.role
  if (!role) return to.path === '/login' ? undefined : navigateTo('/login')
  if (to.path === '/login') return navigateTo(roleHome[role])
  const staff = staffLinks.find((link) => link.to === to.path)
  if (to.path.startsWith('/staff/') && !staff?.roles.includes(role))
    return navigateTo(roleHome[role])
  const employeeOnly =
    ['/', '/orders', '/cart', '/checkout', '/notifications'].includes(to.path) ||
    to.path.startsWith('/catalog')
  if (employeeOnly && role !== 'employee') return navigateTo(roleHome[role])
})
