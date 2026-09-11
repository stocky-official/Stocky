import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { locations } from './locations';
import { products } from './products';
import { stockLots } from './stockLots';
import { companyUsers } from './users';

export const stockCountStatusEnum = pgEnum('stock_count_status', [
  'open',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
]);

export const stockCountLineStatusEnum = pgEnum('stock_count_line_status', [
  'pending',
  'matched',
  'variance',
  'approved',
]);

export const stockCountSessions = pgTable('stock_count_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  status: stockCountStatusEnum('status').default('open').notNull(),
  startedByCompanyUserId: uuid('started_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  reviewedByCompanyUserId: uuid('reviewed_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

export const stockCountLines = pgTable('stock_count_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => stockCountSessions.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  stockLotId: uuid('stock_lot_id').references(() => stockLots.id, { onDelete: 'restrict' }),
  expectedQuantity: integer('expected_quantity').notNull().default(0),
  countedQuantity: integer('counted_quantity'),
  status: stockCountLineStatusEnum('status').default('pending').notNull(),
  varianceReason: text('variance_reason'),
  countedByAuthUserId: uuid('counted_by_auth_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockCountSession = typeof stockCountSessions.$inferSelect;
export type NewStockCountSession = typeof stockCountSessions.$inferInsert;
export type StockCountLine = typeof stockCountLines.$inferSelect;
export type NewStockCountLine = typeof stockCountLines.$inferInsert;
