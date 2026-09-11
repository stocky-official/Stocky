import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { locations } from './locations';
import { products } from './products';
import { stockLots } from './stockLots';

export const stockMovementTypeEnum = pgEnum('stock_movement_type', [
  'opening_balance',
  'receive',
  'count_adjustment',
  'transfer_out',
  'transfer_in',
  'return_to_supplier',
  'disposal',
  'correction',
]);

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }).notNull(),
  stockLotId: uuid('stock_lot_id').references(() => stockLots.id, { onDelete: 'restrict' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'restrict' }).notNull(),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  quantityDelta: integer('quantity_delta').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: uuid('reference_id'),
  reason: text('reason'),
  createdByAuthUserId: uuid('created_by_auth_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
