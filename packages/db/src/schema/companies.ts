import { pgEnum, pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const companyStatusEnum = pgEnum('company_status', [
  'pending',
  'verified',
  'rejected',
  'suspended',
]);

export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  logoUrl: text('logo_url'),
  status: companyStatusEnum('status').default('pending').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedByAuthUserId: uuid('verified_by_auth_user_id'),
  verificationNote: text('verification_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
