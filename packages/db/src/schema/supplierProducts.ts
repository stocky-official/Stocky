import { numeric, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { products } from './products';
import { suppliers } from './suppliers';

export const supplierProducts = pgTable('supplier_products', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  supplierSku: varchar('supplier_sku', { length: 100 }),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('supplier_products_company_supplier_product_idx').on(table.companyId, table.supplierId, table.productId)]);

export type SupplierProduct = typeof supplierProducts.$inferSelect;
export type NewSupplierProduct = typeof supplierProducts.$inferInsert;
