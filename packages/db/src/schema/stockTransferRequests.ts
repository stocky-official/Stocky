import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { branches } from './branches';
import { items } from './items';

export const stockTransferStatusEnum = pgEnum('stock_transfer_status', [
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled',
]);

export const stockTransferRequests = pgTable('stock_transfer_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  sourceBranchId: uuid('source_branch_id')
    .references(() => branches.id, { onDelete: 'restrict' })
    .notNull(),
  destinationBranchId: uuid('destination_branch_id')
    .references(() => branches.id, { onDelete: 'restrict' })
    .notNull(),
  sourceItemId: uuid('source_item_id').references(() => items.id, { onDelete: 'set null' }),
  destinationItemId: uuid('destination_item_id').references(() => items.id, { onDelete: 'set null' }),
  productName: varchar('product_name', { length: 255 }).notNull(),
  categoryName: varchar('category_name', { length: 150 }),
  barcode: varchar('barcode', { length: 100 }),
  quantityRequested: integer('quantity_requested').notNull(),
  quantityApproved: integer('quantity_approved'),
  status: stockTransferStatusEnum('status').default('pending').notNull(),
  note: text('note'),
  decisionNote: text('decision_note'),
  requestedByAuthUserId: uuid('requested_by_auth_user_id').notNull(),
  reviewedByAuthUserId: uuid('reviewed_by_auth_user_id'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  receivedByAuthUserId: uuid('received_by_auth_user_id'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockTransferRequest = typeof stockTransferRequests.$inferSelect;
export type NewStockTransferRequest = typeof stockTransferRequests.$inferInsert;
