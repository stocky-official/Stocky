import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 50 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
