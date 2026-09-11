import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { locations } from './locations';
import { products } from './products';
import { stockLots } from './stockLots';
import { companyUsers } from './users';

export const inventoryTransferStatusEnum = pgEnum('inventory_transfer_status', [
  'draft',
  'requested',
  'approved',
  'in_transit',
  'partially_received',
  'received',
  'rejected',
  'cancelled',
]);

export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  sourceLocationId: uuid('source_location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  destinationLocationId: uuid('destination_location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  status: inventoryTransferStatusEnum('status').default('requested').notNull(),
  requestedByCompanyUserId: uuid('requested_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  reviewedByCompanyUserId: uuid('reviewed_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  receivedByCompanyUserId: uuid('received_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  note: text('note'),
  decisionNote: text('decision_note'),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stockTransferLines = pgTable('stock_transfer_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  transferId: uuid('transfer_id').references(() => stockTransfers.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  sourceLotId: uuid('source_lot_id').references(() => stockLots.id, { onDelete: 'restrict' }),
  quantityRequested: integer('quantity_requested').notNull(),
  quantityApproved: integer('quantity_approved'),
  quantityReceived: integer('quantity_received').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockTransfer = typeof stockTransfers.$inferSelect;
export type NewStockTransfer = typeof stockTransfers.$inferInsert;
export type StockTransferLine = typeof stockTransferLines.$inferSelect;
export type NewStockTransferLine = typeof stockTransferLines.$inferInsert;
