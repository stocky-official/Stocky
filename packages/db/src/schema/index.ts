import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { companyApplications } from './companyApplications';
import { platformAdmins } from './platformAdmins';
import { companyUsers } from './users';
import { branches } from './branches';
import { categories } from './categories';
import { items } from './items';
import { suppliers, supplierItems, supplierContacts } from './suppliers';
import { supplierProducts } from './supplierProducts';
import { alerts } from './alerts';
import { stockTransferRequests } from './stockTransferRequests';
import { locations, userLocations } from './locations';
import { products } from './products';
import { stockLots } from './stockLots';
import { stockMovements } from './stockMovements';
import { stockCountSessions, stockCountLines } from './stockCounts';
import { stockTransfers, stockTransferLines } from './stockTransfersV2';
import { supplierRequests } from './supplierRequests';
import { notifications } from './notifications';
import { stockTasks, stockActivityLogs } from './stockTasks';

export * from './companies';
export * from './companyApplications';
export * from './platformAdmins';
export * from './users';
export * from './branches';
export * from './categories';
export * from './items';
export * from './suppliers';
export * from './supplierProducts';
export * from './alerts';
export * from './stockTransferRequests';
export * from './locations';
export * from './products';
export * from './stockLots';
export * from './stockMovements';
export * from './stockCounts';
export * from './stockTransfersV2';
export * from './supplierRequests';
export * from './notifications';
export * from './stockTasks';
export * from './attendance';

// Relational Definitions
export const companiesRelations = relations(companies, ({ many }) => ({
  applications: many(companyApplications),
  users: many(companyUsers),
  branches: many(branches),
  categories: many(categories),
  items: many(items),
  suppliers: many(suppliers),
  alerts: many(alerts),
  stockTransferRequests: many(stockTransferRequests),
  stockTasks: many(stockTasks),
  stockActivityLogs: many(stockActivityLogs),
}));

export const companyApplicationsRelations = relations(companyApplications, ({ one }) => ({
  company: one(companies, {
    fields: [companyApplications.companyId],
    references: [companies.id],
  }),
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
  stockTransferRequestsFrom: many(stockTransferRequests, { relationName: 'sourceBranch' }),
  stockTransferRequestsTo: many(stockTransferRequests, { relationName: 'destinationBranch' }),
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
  transferRequestsAsSource: many(stockTransferRequests, { relationName: 'sourceItem' }),
  transferRequestsAsDestination: many(stockTransferRequests, { relationName: 'destinationItem' }),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [suppliers.companyId],
    references: [companies.id],
  }),
  suppliedItems: many(supplierItems),
  suppliedProducts: many(supplierProducts),
  contacts: many(supplierContacts),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  company: one(companies, {
    fields: [supplierContacts.companyId],
    references: [companies.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierItemsRelations = relations(supplierItems, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierItems.supplierId],
    references: [suppliers.id],
  }),
}));

export const supplierProductsRelations = relations(supplierProducts, ({ one }) => ({
  company: one(companies, { fields: [supplierProducts.companyId], references: [companies.id] }),
  supplier: one(suppliers, { fields: [supplierProducts.supplierId], references: [suppliers.id] }),
  product: one(products, { fields: [supplierProducts.productId], references: [products.id] }),
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

export const stockTransferRequestsRelations = relations(stockTransferRequests, ({ one }) => ({
  company: one(companies, {
    fields: [stockTransferRequests.companyId],
    references: [companies.id],
  }),
  sourceBranch: one(branches, {
    relationName: 'sourceBranch',
    fields: [stockTransferRequests.sourceBranchId],
    references: [branches.id],
  }),
  destinationBranch: one(branches, {
    relationName: 'destinationBranch',
    fields: [stockTransferRequests.destinationBranchId],
    references: [branches.id],
  }),
  sourceItem: one(items, {
    relationName: 'sourceItem',
    fields: [stockTransferRequests.sourceItemId],
    references: [items.id],
  }),
  destinationItem: one(items, {
    relationName: 'destinationItem',
    fields: [stockTransferRequests.destinationItemId],
    references: [items.id],
  }),
}));
