import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { companyUsers } from './users';
import { branches } from './branches';
import { categories } from './categories';
import { items } from './items';
import { suppliers, supplierItems } from './suppliers';
import { alerts } from './alerts';

export * from './companies';
export * from './users';
export * from './branches';
export * from './categories';
export * from './items';
export * from './suppliers';
export * from './alerts';

// Relational Definitions
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(companyUsers),
  branches: many(branches),
  categories: many(categories),
  items: many(items),
  suppliers: many(suppliers),
  alerts: many(alerts),
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  company: one(companies, {
    fields: [branches.companyId],
    references: [companies.id],
  }),
  items: many(items),
  alerts: many(alerts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  company: one(companies, {
    fields: [categories.companyId],
    references: [companies.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  company: one(companies, {
    fields: [items.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [items.branchId],
    references: [branches.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  alerts: many(alerts),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [suppliers.companyId],
    references: [companies.id],
  }),
  suppliedItems: many(supplierItems),
}));

export const supplierItemsRelations = relations(supplierItems, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierItems.supplierId],
    references: [suppliers.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  company: one(companies, {
    fields: [alerts.companyId],
    references: [companies.id],
  }),
  branch: one(branches, {
    fields: [alerts.branchId],
    references: [branches.id],
  }),
  item: one(items, {
    fields: [alerts.itemId],
    references: [items.id],
  }),
}));
