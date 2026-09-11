import { boolean, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { companyUsers } from './users';

export const locationTypeEnum = pgEnum('location_type', ['warehouse', 'branch']);

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  type: locationTypeEnum('type').default('branch').notNull(),
  address: text('address'),
  phone: varchar('phone', { length: 50 }),
  managerUserId: uuid('manager_user_id').references(() => companyUsers.id, { onDelete: 'set null' }),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userLocations = pgTable('user_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => companyUsers.id, { onDelete: 'cascade' }).notNull(),
  locationId: uuid('location_id').references(() => locations.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type UserLocation = typeof userLocations.$inferSelect;
export type NewUserLocation = typeof userLocations.$inferInsert;
