import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(), // Supplier name
  // Person to contact
  contactName: varchar('contact_name', { length: 255 }).notNull(),   // person to contact name
  contactPhone: varchar('contact_phone', { length: 50 }).notNull(),  // person to contact phone number
  contactEmail: varchar('contact_email', { length: 255 }),           // person to contact email
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const supplierItems = pgTable('supplier_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, { onDelete: 'cascade' })
    .notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  itemCategory: varchar('item_category', { length: 150 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
