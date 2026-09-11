import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { locations } from './locations';
import { products } from './products';
import { suppliers } from './suppliers';

export const stockLotStatusEnum = pgEnum('stock_lot_status', [
  'available',
  'on_hold',
  'expired',
  'depleted',
  'returned',
  'disposed',
]);

export const stockLots = pgTable('stock_lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  lotNumber: varchar('lot_number', { length: 100 }),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
  manufacturedAt: timestamp('manufactured_at', { withTimezone: true }),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  expiryNotificationDays: integer('expiry_notification_days'),
  quantityOnHand: integer('quantity_on_hand').notNull().default(0),
  unitCost: numeric('unit_cost', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: stockLotStatusEnum('status').default('available').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockLot = typeof stockLots.$inferSelect;
export type NewStockLot = typeof stockLots.$inferInsert;
