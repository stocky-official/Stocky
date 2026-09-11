import { boolean, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const platformAdmins = pgTable('platform_admins', {
  authUserId: uuid('auth_user_id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PlatformAdmin = typeof platformAdmins.$inferSelect;
export type NewPlatformAdmin = typeof platformAdmins.$inferInsert;
