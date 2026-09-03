import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { branches } from './branches';

export const userRoleEnum = pgEnum('company_user_role', [
  'owner',
  'admin',
  'manager',
  'staff',
]);

export const companyUsers = pgTable('company_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id'), // matches auth.users.id once signed in
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('staff').notNull(),
  // Granular Authorizations
  canEdit: boolean('can_edit').default(true).notNull(),
  canDelete: boolean('can_delete').default(false).notNull(),
  status: varchar('status', { length: 50 }).default('invited').notNull(), // 'invited' | 'active'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userBranches = pgTable(
  'user_branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => companyUsers.id, { onDelete: 'cascade' })
      .notNull(),
    branchId: uuid('branch_id')
      .references(() => branches.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_branches_user_branch_idx').on(table.userId, table.branchId),
  ]
);

export type CompanyUser = typeof companyUsers.$inferSelect;
export type NewCompanyUser = typeof companyUsers.$inferInsert;

export type UserBranch = typeof userBranches.$inferSelect;
export type NewUserBranch = typeof userBranches.$inferInsert;
