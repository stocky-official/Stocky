/**
 * Core Domain Types for Stocky v0.1.0
 */

export type CompanyUserRole = 'owner' | 'admin' | 'manager' | 'staff';

export interface Company {
  id: string;
  name: string;
  code?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  authUserId?: string | null;
  companyId: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: CompanyUserRole;
  canEdit: boolean;
  canDelete: boolean;
  status: 'invited' | 'active';
  branchIds?: string[];
  assignedBranches?: Branch[];
  createdAt: string;
  updatedAt: string;
}

export interface UserBranch {
  id: string;
  userId: string;
  branchId: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  companyId: string;
  branchId: string;
  categoryId?: string | null;
  categoryName: string; // item category
  name: string;         // item name
  barcode?: string | null; // item barcode
  balance: number;      // item Balance
  quantity: number;     // item Quantity
  expiryDate?: string | null; // item Expiry Date
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;         // Supplier name
  contactName: string;  // person to contact name
  contactPhone: string; // person to contact phone number
  contactEmail?: string | null; // person to contact email
  itemsSupplied?: string[]; // categories or goods supplied
  itemCount?: number;       // total number of SKUs supplied
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  companyId: string;
  branchId?: string | null;
  itemId?: string | null;
  title: string;
  message?: string | null;
  severity: 'critical' | 'warning' | 'info';
  isResolved: boolean;
  createdAt: string;
}
