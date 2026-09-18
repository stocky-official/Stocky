import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { companyUsers } from './users';
import { locations } from './locations';
import { products } from './products';
import { stockLots } from './stockLots';

export const stockTaskTypeEnum = pgEnum('stock_task_type', ['count', 'expiry', 'open']);

export const stockTaskStatusEnum = pgEnum('stock_task_status', [
  'assigned',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
]);

export const stockTaskItemStatusEnum = pgEnum('stock_task_item_status', [
  'pending',
  'completed',
  'approved',
]);

export const stockTasks = pgTable('stock_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  taskType: stockTaskTypeEnum('task_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  status: stockTaskStatusEnum('status').default('assigned').notNull(),
  assignedToCompanyUserId: uuid('assigned_to_company_user_id').references(() => companyUsers.id, { onDelete: 'restrict' }).notNull(),
  createdByCompanyUserId: uuid('created_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }),
  scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stockTaskItems = pgTable('stock_task_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  taskId: uuid('task_id').references(() => stockTasks.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  stockLotId: uuid('stock_lot_id').references(() => stockLots.id, { onDelete: 'restrict' }),
  countedQuantity: integer('counted_quantity'),
  observedExpiryDate: timestamp('observed_expiry_date', { withTimezone: true }),
  note: text('note'),
  status: stockTaskItemStatusEnum('status').default('pending').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stockTaskExpected = pgTable('stock_task_expected', {
  taskItemId: uuid('task_item_id').references(() => stockTaskItems.id, { onDelete: 'cascade' }).primaryKey(),
  expectedQuantity: integer('expected_quantity'),
  expectedExpiryDate: timestamp('expected_expiry_date', { withTimezone: true }),
});

export const stockActivityLogs = pgTable('stock_activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
  actorCompanyUserId: uuid('actor_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  actorAuthUserId: uuid('actor_auth_user_id'),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id'),
  action: varchar('action', { length: 80 }).notNull(),
  summary: text('summary').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockTask = typeof stockTasks.$inferSelect;
export type NewStockTask = typeof stockTasks.$inferInsert;
export type StockTaskItem = typeof stockTaskItems.$inferSelect;
export type NewStockTaskItem = typeof stockTaskItems.$inferInsert;
export type StockTaskExpected = typeof stockTaskExpected.$inferSelect;
export type NewStockTaskExpected = typeof stockTaskExpected.$inferInsert;
export type StockActivityLog = typeof stockActivityLogs.$inferSelect;
export type NewStockActivityLog = typeof stockActivityLogs.$inferInsert;
