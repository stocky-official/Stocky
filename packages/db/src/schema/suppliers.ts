import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(), // Supplier name
  address: text('address'),
  // Person to contact
  contactName: varchar('contact_name', { length: 255 }).notNull(),   // person to contact name
  contactPhone: varchar('contact_phone', { length: 50 }).notNull(),  // person to contact phone number
  contactEmail: varchar('contact_email', { length: 255 }),           // person to contact email
  imageUrl: text('image_url'),                                       // supplier profile / logo image
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

export const supplierContacts = pgTable('supplier_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  supplierId: uuid('supplier_id')
    .references(() => suppliers.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 150 }),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});


export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierItem = typeof supplierItems.$inferSelect;
export type NewSupplierItem = typeof supplierItems.$inferInsert;
export type SupplierContact = typeof supplierContacts.$inferSelect;
export type NewSupplierContact = typeof supplierContacts.$inferInsert;
