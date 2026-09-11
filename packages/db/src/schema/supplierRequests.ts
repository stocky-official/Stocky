import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { locations } from './locations';
import { products } from './products';
import { suppliers } from './suppliers';
import { companyUsers } from './users';

export const supplierRequestTypeEnum = pgEnum('supplier_request_type', [
  'replenish',
  'return',
  'replace',
]);

export const supplierRequestStatusEnum = pgEnum('supplier_request_status', [
  'open',
  'contacted',
  'ordered',
  'received',
  'closed',
  'cancelled',
]);

export const supplierRequests = pgTable('supplier_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  requestType: supplierRequestTypeEnum('request_type').default('replenish').notNull(),
  status: supplierRequestStatusEnum('status').default('open').notNull(),
  quantityRequested: integer('quantity_requested'),
  reason: text('reason'),
  notes: text('notes'),
  createdByCompanyUserId: uuid('created_by_company_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SupplierRequest = typeof supplierRequests.$inferSelect;
export type NewSupplierRequest = typeof supplierRequests.$inferInsert;
