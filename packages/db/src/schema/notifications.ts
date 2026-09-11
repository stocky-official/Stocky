import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { companyUsers } from './users';

export const notificationTypeEnum = pgEnum('notification_type', [
  'expiry',
  'low_stock',
  'transfer',
  'count_review',
  'supplier_request',
  'data_quality',
]);

export const notificationSeverityEnum = pgEnum('notification_severity', ['info', 'warning', 'critical']);

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  recipientCompanyUserId: uuid('recipient_company_user_id').references(() => companyUsers.id, { onDelete: 'cascade' }).notNull(),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  severity: notificationSeverityEnum('severity').default('info').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message'),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  isRead: boolean('is_read').default(false).notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
