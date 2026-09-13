/**
 * Core Domain Types for Stocky v0.1.0
 */

export type CompanyUserRole = 'owner' | 'admin' | 'manager' | 'staff';
export type CompanyStatus = 'pending' | 'verified' | 'rejected' | 'suspended';
export type CompanyApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

export interface Company {
  id: string;
  name: string;
  code?: string | null;
  logoUrl?: string | null;
  status?: CompanyStatus;
  verifiedAt?: string | null;
  verifiedByAuthUserId?: string | null;
  verificationNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyApplication {
  id: string;
  requestedByAuthUserId: string;
  requestedEmail: string;
  companyId?: string | null;
  companyName: string;
  companyCode?: string | null;
  logoPath?: string | null;
  initialBranchName?: string | null;
  status: CompanyApplicationStatus;
  reviewedByAuthUserId?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
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
  expiryNotificationDays?: number | null; // item-specific notification window before expiry
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;         // Supplier name
  address?: string | null;
  contactName: string;  // person to contact name
  contactPhone: string; // person to contact phone number
  contactEmail?: string | null; // person to contact email
  itemsSupplied?: string[]; // categories or goods supplied
  itemCount?: number;       // total number of SKUs supplied
  imageUrl?: string | null; // supplier logo or profile image
  createdAt: string;
  updatedAt: string;
}

export interface SupplierContact {
  id: string;
  companyId: string;
  supplierId: string;
  name: string;
  role?: string | null;
  phone: string;
  email?: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LocationType = 'warehouse' | 'branch';

export interface Location {
  id: string;
  companyId: string;
  name: string;
  code?: string | null;
  type: LocationType;
  address?: string | null;
  phone?: string | null;
  managerUserId?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  barcode?: string | null;
  categoryId?: string | null;
  categoryName: string;
  unitName: string;
  reorderPoint: number;
  defaultExpiryNotificationDays?: number | null;
  defaultSupplierId?: string | null;
  unitCost: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StockLotStatus = 'available' | 'on_hold' | 'expired' | 'depleted' | 'returned' | 'disposed';

export interface StockLot {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  supplierId?: string | null;
  lotNumber?: string | null;
  receivedAt: string;
  manufacturedAt?: string | null;
  expiryDate?: string | null;
  expiryNotificationDays?: number | null;
  quantityOnHand: number;
  unitCost: number;
  status: StockLotStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'opening_balance'
  | 'receive'
  | 'count_adjustment'
  | 'transfer_out'
  | 'transfer_in'
  | 'return_to_supplier'
  | 'disposal'
  | 'correction';

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  stockLotId: string;
  locationId: string;
  movementType: StockMovementType;
  quantityDelta: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdByAuthUserId?: string | null;
  createdAt: string;
}

export type StockTaskType = 'count' | 'expiry';
export type StockTaskStatus = 'assigned' | 'in_progress' | 'submitted' | 'approved' | 'rejected' | 'cancelled';
export type StockTaskItemStatus = 'pending' | 'completed' | 'approved';

export interface StockTask {
  id: string;
  companyId: string;
  locationId: string;
  taskType: StockTaskType;
  title: string;
  status: StockTaskStatus;
  assignedToCompanyUserId: string;
  createdByCompanyUserId?: string | null;
  notes?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockTaskItem {
  id: string;
  taskId: string;
  productId: string;
  stockLotId?: string | null;
  countedQuantity?: number | null;
  observedExpiryDate?: string | null;
  note?: string | null;
  status: StockTaskItemStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockTaskExpected {
  taskItemId: string;
  expectedQuantity?: number | null;
  expectedExpiryDate?: string | null;
}

export interface StockActivityLog {
  id: string;
  companyId: string;
  locationId?: string | null;
  actorCompanyUserId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  summary: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export type StockCountStatus = 'open' | 'submitted' | 'approved' | 'rejected' | 'cancelled';

export interface StockCountSession {
  id: string;
  companyId: string;
  locationId: string;
  status: StockCountStatus;
  startedByCompanyUserId?: string | null;
  reviewedByCompanyUserId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export interface StockCountLine {
  id: string;
  sessionId: string;
  productId: string;
  stockLotId?: string | null;
  expectedQuantity: number;
  countedQuantity?: number | null;
  status: 'pending' | 'matched' | 'variance' | 'approved';
  varianceReason?: string | null;
  countedByAuthUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InventoryTransferStatus =
  | 'draft'
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'partially_received'
  | 'received'
  | 'rejected'
  | 'cancelled';

export interface InventoryTransfer {
  id: string;
  companyId: string;
  sourceLocationId: string;
  destinationLocationId: string;
  status: InventoryTransferStatus;
  requestedByCompanyUserId?: string | null;
  reviewedByCompanyUserId?: string | null;
  receivedByCompanyUserId?: string | null;
  note?: string | null;
  decisionNote?: string | null;
  requestedAt: string;
  approvedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransferLine {
  id: string;
  transferId: string;
  productId: string;
  sourceLotId?: string | null;
  quantityRequested: number;
  quantityApproved?: number | null;
  quantityReceived: number;
  createdAt: string;
}

export type SupplierRequestType = 'replenish' | 'return' | 'replace';
export type SupplierRequestStatus = 'open' | 'contacted' | 'ordered' | 'received' | 'closed' | 'cancelled';

export interface SupplierRequest {
  id: string;
  companyId: string;
  locationId: string;
  supplierId?: string | null;
  productId: string;
  requestType: SupplierRequestType;
  status: SupplierRequestStatus;
  quantityRequested?: number | null;
  reason?: string | null;
  notes?: string | null;
  createdByCompanyUserId?: string | null;
  lastContactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProduct {
  id: string;
  companyId: string;
  supplierId: string;
  productId: string;
  supplierSku?: string | null;
  unitCost?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Shared action contracts used by the web and mobile clients. These describe
// user intent; clients should call the matching transactional command rather
// than mutating quantity fields directly.
export interface ReceiveStockCommand {
  productId: string;
  locationId: string;
  quantity: number;
  lotNumber?: string | null;
  expiryDate?: string | null;
  expiryNotificationDays?: number | null;
  supplierId?: string | null;
  unitCost?: number;
  notes?: string | null;
}

export interface SubmitCountCommand {
  sessionId: string;
  lines: Array<{ productId: string; countedQuantity: number; varianceReason?: string | null }>;
}

export interface CreateStockTaskCommand {
  locationId: string;
  taskType: StockTaskType;
  assignedToCompanyUserId: string;
  productIds: string[];
  note?: string | null;
  scheduledStartAt?: string | null;
  scheduledEndAt?: string | null;
}

export interface SubmitStockTaskCommand {
  taskId: string;
  items: Array<{
    taskItemId: string;
    countedQuantity?: number | null;
    observedExpiryDate?: string | null;
    note?: string | null;
  }>;
}

export interface ReviewStockTaskCommand {
  taskId: string;
  approve: boolean;
  note?: string | null;
}

export interface ApproveCountCommand { sessionId: string; approve: boolean; note?: string | null; }

export interface RequestTransferCommand {
  sourceLocationId: string;
  destinationLocationId: string;
  lines: Array<{ productId: string; quantity: number }>;
  note?: string | null;
}

export interface ApproveTransferCommand { transferId: string; approve: boolean; note?: string | null; }

export interface ReceiveTransferCommand {
  transferId: string;
  lines?: Array<{ lineId: string; quantityReceived: number }>;
  note?: string | null;
}

export interface CreateSupplierRequestCommand {
  productId: string;
  locationId: string;
  requestType: SupplierRequestType;
  supplierId?: string | null;
  quantity?: number | null;
  reason?: string | null;
}

export interface ResolveExpiryActionCommand {
  lotId: string;
  action: 'hold' | 'dispose' | 'return' | 'replace';
  reason?: string | null;
}

export type NotificationType = 'expiry' | 'low_stock' | 'transfer' | 'count_review' | 'supplier_request' | 'data_quality';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface NotificationTask {
  id: string;
  companyId: string;
  recipientCompanyUserId: string;
  notificationType: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string | null;
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

export type StockTransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface StockTransferRequest {
  id: string;
  companyId: string;
  sourceBranchId: string;
  destinationBranchId: string;
  sourceItemId?: string | null;
  destinationItemId?: string | null;
  productName: string;
  categoryName?: string | null;
  barcode?: string | null;
  quantityRequested: number;
  quantityApproved?: number | null;
  status: StockTransferStatus;
  note?: string | null;
  decisionNote?: string | null;
  requestedByAuthUserId: string;
  reviewedByAuthUserId?: string | null;
  reviewedAt?: string | null;
  receivedByAuthUserId?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ShiftStatus = 'present' | 'late' | 'early_departure' | 'overtime' | 'incomplete';
export type PunchMethod = 'qr_scan' | 'kiosk' | 'manual';
export type LeaveType = 'pto' | 'sick' | 'emergency' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AttendanceShift {
  id: string;
  companyId: string;
  locationId: string;
  companyUserId: string;
  shiftDate: string;
  clockInAt: string;
  clockOutAt?: string | null;
  totalMinutes?: number | null;
  status: ShiftStatus;
  punchInMethod: PunchMethod;
  punchOutMethod?: PunchMethod | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  companyUserId: string;
  approverCompanyUserId: string;
  taskId?: string | null;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason?: string | null;
  status: LeaveStatus;
  managerNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  companyId: string;
  companyUserId: string;
  year: number;
  ptoAllowance: number;
  ptoUsed: number;
  sickAllowance: number;
  sickUsed: number;
  createdAt: string;
  updatedAt: string;
}
