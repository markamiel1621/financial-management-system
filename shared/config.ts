import type { Funding, Persona, Role } from './types'

export const settings = {
  name: 'FMS',
  title: 'Financial Management System',
  currency: 'PHP',
  locale: 'en-PH',
  timezone: 'Asia/Manila',
  policy: 'DEMO-1',
  storageKey: 'folio.fms.demo.v1',
  sampleDate: '2026-11-24T02:00:00Z',
  office: 'Administrative Services',
}

export function resolveAppName(value: unknown): string {
  if (typeof value === 'string') return value.trim() || settings.name
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return settings.name
}

export const roleNames: Record<Role, string> = {
  employee: 'Employee',
  supervisor: 'Supervisor',
  finance: 'Finance / Cashier',
  fulfillment: 'Fulfillment Staff',
  catalog: 'Catalog Manager',
  admin: 'Administrator',
}

export const personas: Record<Role, Persona> = {
  employee: {
    id: 'EMP-0142',
    name: 'Alex Reyes',
    initials: 'AR',
    office: settings.office,
    position: 'Administrative Officer',
    role: 'employee',
  },
  supervisor: {
    id: 'SUP-002',
    name: 'Elena Cruz',
    initials: 'EC',
    office: settings.office,
    position: 'Office Supervisor',
    role: 'supervisor',
  },
  finance: {
    id: 'FIN-007',
    name: 'Nico Santos',
    initials: 'NS',
    office: 'Finance Office',
    position: 'Cashier',
    role: 'finance',
  },
  fulfillment: {
    id: 'OPS-003',
    name: 'Maya Torres',
    initials: 'MT',
    office: 'General Services',
    position: 'Fulfillment Coordinator',
    role: 'fulfillment',
  },
  catalog: {
    id: 'CAT-004',
    name: 'Luis Garcia',
    initials: 'LG',
    office: 'General Services',
    position: 'Catalog Manager',
    role: 'catalog',
  },
  admin: {
    id: 'ADM-001',
    name: 'Bea Ramos',
    initials: 'BR',
    office: 'System Administration',
    position: 'System Administrator',
    role: 'admin',
  },
}

export const fundingLabels: Record<Funding, string> = {
  employee: 'Employee payment',
  internal: 'Internal allocation',
  free: 'No employee charge',
}

export const roleHome: Record<Role, string> = {
  employee: '/',
  supervisor: '/staff/review',
  finance: '/staff/payments',
  fulfillment: '/staff/fulfillment',
  catalog: '/staff/catalog',
  admin: '/staff/administration',
}
