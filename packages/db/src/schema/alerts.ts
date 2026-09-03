import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { branches } from './branches';
import { items } from './items';

export const alertSeverityEnum = pgEnum('alert_severity', [
  'critical',
  'warning',
  'info',
]);

export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'set null' }),
  itemId: uuid('item_id')
    .references(() => items.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  severity: alertSeverityEnum('severity').default('warning').notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
