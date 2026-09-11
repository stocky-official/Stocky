import { boolean, integer, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { categories } from './categories';
import { suppliers } from './suppliers';

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  barcode: varchar('barcode', { length: 100 }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  categoryName: varchar('category_name', { length: 150 }).notNull().default('General'),
  unitName: varchar('unit_name', { length: 50 }).notNull().default('unit'),
  reorderPoint: integer('reorder_point').notNull().default(0),
  defaultExpiryNotificationDays: integer('default_expiry_notification_days'),
  defaultSupplierId: uuid('default_supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
