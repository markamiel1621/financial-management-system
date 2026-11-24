// Development starting point. The presentation reads fixtures and opens no database connection.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const fundingMode = pgEnum('funding_mode', ['employee', 'internal', 'free'])
export const accountRole = pgEnum('account_role', [
  'employee',
  'supervisor',
  'finance',
  'fulfillment',
  'catalog',
  'admin',
])
export const orderState = pgEnum('order_state', [
  'Submitted',
  'Under review',
  'Returned',
  'Approved',
  'In progress',
  'Completed',
  'Rejected',
  'Cancelled',
])
export const approvalState = pgEnum('approval_state', [
  'Not required',
  'Pending',
  'Under review',
  'Returned',
  'Approved',
  'Rejected',
])
export const lineState = pgEnum('line_state', [
  'Not started',
  'In progress',
  'Ready',
  'Fulfilled',
  'Cancelled',
])

export const offices = pgTable('offices', { id: text().primaryKey(), name: text().notNull() })
export const accounts = pgTable('accounts', {
  id: text().primaryKey(),
  name: text().notNull(),
  officeId: text('office_id')
    .notNull()
    .references(() => offices.id),
})
export const roleGrants = pgTable(
  'role_grants',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    role: accountRole().notNull(),
    officeId: text('office_id')
      .notNull()
      .references(() => offices.id),
  },
  (table) => [primaryKey({ columns: [table.accountId, table.role, table.officeId] })],
)

export const catalogItems = pgTable(
  'catalog_items',
  {
    id: text().primaryKey(),
    sku: text().notNull().unique(),
    title: text().notNull(),
    unit: text().notNull(),
    price: integer('price_centavos').notNull(),
    funding: fundingMode().notNull(),
    review: boolean().notNull(),
    capacity: integer(),
    active: boolean().notNull().default(true),
    version: integer().notNull().default(1),
  },
  (table) => [
    check('nonnegative_catalog_price', sql`${table.price} >= 0`),
    check('nonnegative_capacity', sql`${table.capacity} is null or ${table.capacity} >= 0`),
  ],
)

export const orders = pgTable(
  'orders',
  {
    id: text().primaryKey(),
    employeeId: text('employee_id')
      .notNull()
      .references(() => accounts.id),
    officeId: text('office_id')
      .notNull()
      .references(() => offices.id),
    placedAt: timestamp('placed_at', { withTimezone: true }).notNull(),
    checkoutKey: text('checkout_key').notNull(),
    policyVersion: text('policy_version').notNull(),
    funding: fundingMode().notNull(),
    currency: text().notNull().default('PHP'),
    status: orderState().notNull(),
    approval: approvalState().notNull(),
    purpose: text().notNull(),
    version: integer().notNull().default(1),
  },
  (table) => [
    unique('employee_checkout_key').on(table.employeeId, table.checkoutKey),
    index('employee_order_date').on(table.employeeId, table.placedAt),
  ],
)

export const orderLines = pgTable(
  'order_lines',
  {
    id: text().primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    itemId: text('item_id').references(() => catalogItems.id),
    title: text().notNull(),
    sku: text().notNull(),
    unit: text().notNull(),
    option: text().notNull(),
    delivery: text().notNull(),
    unitPrice: integer('unit_price_centavos').notNull(),
    quantity: integer().notNull(),
    fulfilled: integer().notNull().default(0),
    state: lineState().notNull(),
  },
  (table) => [
    check(
      'valid_order_quantities',
      sql`${table.quantity} > 0 and ${table.fulfilled} between 0 and ${table.quantity}`,
    ),
    check('nonnegative_order_price', sql`${table.unitPrice} >= 0`),
  ],
)

export const collections = pgTable(
  'collections',
  {
    id: text().primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    reference: text().notNull().unique(),
    amount: integer('amount_centavos').notNull(),
    recordedBy: text('recorded_by')
      .notNull()
      .references(() => accounts.id),
    verifiedBy: text('verified_by').references(() => accounts.id),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  },
  (table) => [check('positive_collection', sql`${table.amount} > 0`)],
)
export const allocations = pgTable(
  'allocations',
  {
    orderId: text('order_id')
      .primaryKey()
      .references(() => orders.id),
    reference: text().notNull(),
    amount: integer('amount_centavos').notNull(),
    verifiedBy: text('verified_by')
      .notNull()
      .references(() => accounts.id),
  },
  (table) => [check('positive_allocation', sql`${table.amount} > 0`)],
)
export const orderEvents = pgTable('order_events', {
  id: text().primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  actor: text().notNull(),
  title: text().notNull(),
  note: text().notNull(),
  visibleToEmployee: boolean('visible_to_employee').notNull(),
  at: timestamp({ withTimezone: true }).notNull(),
})
