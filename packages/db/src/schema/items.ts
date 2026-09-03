import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { branches } from './branches';
import { categories } from './categories';

export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  branchId: uuid('branch_id')
    .references(() => branches.id, { onDelete: 'cascade' })
    .notNull(),
  categoryId: uuid('category_id')
    .references(() => categories.id, { onDelete: 'set null' }),
  categoryName: varchar('category_name', { length: 150 }).notNull(), // item category
  name: varchar('name', { length: 255 }).notNull(),                  // item name
  barcode: varchar('barcode', { length: 100 }),                      // item barcode
  balance: numeric('balance', { precision: 14, scale: 2 }).default('0.00').notNull(), // item Balance
  quantity: integer('quantity').default(0).notNull(),               // item Quantity
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
