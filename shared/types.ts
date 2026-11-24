export type Role = 'employee' | 'supervisor' | 'finance' | 'fulfillment' | 'catalog' | 'admin'
export type Funding = 'employee' | 'internal' | 'free'
export type OrderStatus =
  | 'Submitted'
  | 'Under review'
  | 'Returned'
  | 'Approved'
  | 'In progress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
export type Approval =
  | 'Not required'
  | 'Pending'
  | 'Under review'
  | 'Returned'
  | 'Approved'
  | 'Rejected'
export type LineStatus = 'Not started' | 'In progress' | 'Ready' | 'Fulfilled' | 'Cancelled'

export interface Persona {
  id: string
  name: string
  office: string
  position: string
  initials: string
  role: Role
}

export interface Offering {
  id: string
  sku: string
  title: string
  type: 'Product' | 'Service'
  category: string
  icon: string
  color: string
  description: string
  unit: string
  price: number // All amounts are integer PHP centavos.
  funding: Funding
  review: boolean
  stock: number | null // null means the service has no capacity limit.
  limit: number
  options: string[]
  eligible: boolean
  active: boolean
  requirement: string
  delivery: string
  owner: string
}

export interface CartLine {
  itemId: string
  option: string
  quantity: number
  quotedPrice: number
}

export interface OrderLine {
  itemId: string
  title: string
  sku: string
  option: string
  unit: string
  price: number
  quantity: number
  delivery: string
  fulfilled: number
  status: LineStatus
}

export interface OrderEvent {
  id: string
  at: string
  actor: string
  title: string
  note: string
}

export interface Payment {
  reference: string
  amount: number
  verified: boolean
  recordedBy: string
  verifiedBy?: string
  date: string
}

export interface Order {
  id: string
  employeeId: string
  office: string
  createdAt: string
  status: OrderStatus
  approval: Approval
  funding: Funding
  allocation: { reference: string; verifiedBy: string } | null
  purpose: string
  policy: string
  checkoutKey: string
  checkoutPurpose: string
  lines: OrderLine[]
  payments: Payment[]
  events: OrderEvent[]
}

export interface DemoState {
  version: number
  role: Role | null
  catalog: Offering[]
  cart: CartLine[]
  cartRevision: number
  orders: Order[]
  audit: OrderEvent[]
  readEvents: string[]
}
