import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const companyApplicationStatusEnum = pgEnum('company_application_status', [
  'pending',
  'approved',
  'rejected',
  'withdrawn',
]);

/**
 * A verification request submitted by an authenticated user before their
 * company is allowed to access the operational platform.
 *
 * Auth user IDs intentionally do not reference auth.users because that table
 * is owned by Supabase rather than the public Drizzle schema.
 */
export const companyApplications = pgTable('company_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestedByAuthUserId: uuid('requested_by_auth_user_id').notNull(),
  requestedEmail: varchar('requested_email', { length: 255 }).notNull(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyCode: varchar('company_code', { length: 50 }),
  logoPath: text('logo_path'),
  initialBranchName: varchar('initial_branch_name', { length: 255 }),
  status: companyApplicationStatusEnum('status').default('pending').notNull(),
  reviewedByAuthUserId: uuid('reviewed_by_auth_user_id'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CompanyApplication = typeof companyApplications.$inferSelect;
export type NewCompanyApplication = typeof companyApplications.$inferInsert;
