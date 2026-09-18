'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { parseTenantDomain } from '@/lib/domain';
import type {
  CompanyUserRole,
  CreateStockTaskCommand,
  InventoryTransfer,
  Location,
  NotificationTask,
  Product,
  ReviewStockTaskCommand,
  StockActivityLog,
  StockLot,
  StockMovement,
  StockTask,
  StockTaskExpected,
  StockTaskItem,
  SubmitStockTaskCommand,
  Supplier,
  SupplierContact,
  SupplierProduct,
  SupplierRequest,
  AttendanceShift,
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  PunchMethod,
} from '@stocky/types';
import type {
  NotificationQueueItem,
  NotificationType,
  SupplierContactInput,
  StockLotUpdateInput,
} from '@/widgets';
import { getTabFromPathname, TAB_TO_PATH } from '@/widgets/platformNavigation';

const roleTitles: Record<CompanyUserRole, string> = {
  owner: 'Owner',
  admin: 'Administrator',
  manager: 'Branch Manager',
  staff: 'Staff Member',
};

const adminRoles: CompanyUserRole[] = ['owner', 'admin'];
const staffTabs = [
  'home', 'stock', 'inventory', 'tasks', 'attendance', 'notifications', 'settings', 'receive', 'logs',
  'locations', 'supplier-requests', 'tasks-completed', 'attendance-timesheets', 'attendance-calendar',
  'attendance-leaves', 'attendance-kiosk', 'timesheets', 'calendar', 'leaves', 'kiosk',
];
const managerTabs = [
  'home', 'stock', 'inventory', 'tasks', 'attendance', 'notifications', 'settings', 'receive', 'logs',
  'suppliers', 'transfers', 'locations', 'supplier-requests', 'tasks-completed', 'attendance-timesheets',
  'attendance-calendar', 'attendance-leaves', 'attendance-kiosk', 'timesheets', 'calendar', 'leaves', 'kiosk',
];

const TAB_TO_PAGE_KEY: Record<string, string> = {
  stock: 'inventory',
  inventory: 'inventory',
  transfers: 'transfers',
  suppliers: 'suppliers',
  'supplier-requests': 'suppliers',
  tasks: 'tasks',
  'tasks-completed': 'tasks',
  attendance: 'attendance',
  'attendance-timesheets': 'attendance',
  'attendance-calendar': 'attendance',
  'attendance-leaves': 'attendance',
  'attendance-kiosk': 'attendance',
  timesheets: 'attendance',
  calendar: 'attendance',
  leaves: 'attendance',
  kiosk: 'attendance',
  locations: 'locations',
  team: 'team',
};

export function canOpenTab(
  role: CompanyUserRole,
  tab: string,
  permissions?: { pages?: string[] } | null
) {
  if (role === 'owner') return true;

  if (permissions && Array.isArray(permissions.pages)) {
    const pageKey = TAB_TO_PAGE_KEY[tab];
    // Common platform utility views (home, activity logs, notifications, settings, receive modal)
    if (!pageKey) return true;
    return permissions.pages.includes(pageKey);
  }

  if (adminRoles.includes(role)) return true;
  return (role === 'manager' ? managerTabs : staffTabs).includes(tab);
}

function mapLocation(row: any): Location { return { id: row.id, companyId: row.company_id, name: row.name, code: row.code, type: row.type, address: row.address, phone: row.phone, managerUserId: row.manager_user_id, imageUrl: row.image_url || null, isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapProduct(row: any): Product { return { id: row.id, companyId: row.company_id, name: row.name, barcode: row.barcode, categoryId: row.category_id, categoryName: row.category_name || 'General', unitName: row.unit_name || 'unit', reorderPoint: Number(row.reorder_point || 0), defaultExpiryNotificationDays: row.default_expiry_notification_days == null ? null : Number(row.default_expiry_notification_days), defaultSupplierId: row.default_supplier_id, unitCost: Number(row.unit_cost || 0), imageUrl: row.image_url || null, isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapLot(row: any): StockLot { return { id: row.id, companyId: row.company_id, productId: row.product_id, locationId: row.location_id, supplierId: row.supplier_id, lotNumber: row.lot_number, receivedAt: row.received_at, manufacturedAt: row.manufactured_at, expiryDate: row.expiry_date, expiryNotificationDays: row.expiry_notification_days == null ? null : Number(row.expiry_notification_days), quantityOnHand: Number(row.quantity_on_hand || 0), unitCost: Number(row.unit_cost || 0), status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapSupplier(row: any): Supplier { return { id: row.id, companyId: row.company_id, name: row.name, address: row.address, contactName: row.contact_name || '', contactPhone: row.contact_phone || '', contactEmail: row.contact_email, itemsSupplied: row.items_supplied || [], itemCount: Number(row.item_count || 0), imageUrl: row.image_url || null, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapSupplierContact(row: any): SupplierContact { return { id: row.id, companyId: row.company_id, supplierId: row.supplier_id, name: row.name, role: row.role, phone: row.phone, email: row.email, isPrimary: Boolean(row.is_primary), createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapRequest(row: any): SupplierRequest { return { id: row.id, companyId: row.company_id, locationId: row.location_id, supplierId: row.supplier_id, productId: row.product_id, requestType: row.request_type, status: row.status, quantityRequested: row.quantity_requested, reason: row.reason, notes: row.notes, createdByCompanyUserId: row.created_by_company_user_id, lastContactedAt: row.last_contacted_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapSupplierProduct(row: any): SupplierProduct { return { id: row.id, companyId: row.company_id, supplierId: row.supplier_id, productId: row.product_id, supplierSku: row.supplier_sku, unitCost: row.unit_cost == null ? null : Number(row.unit_cost), notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapNotification(row: any): NotificationTask { return { id: row.id, companyId: row.company_id, recipientCompanyUserId: row.recipient_company_user_id, notificationType: row.notification_type, severity: row.severity, title: row.title, message: row.message, referenceType: row.reference_type, referenceId: row.reference_id, isRead: Boolean(row.is_read), isResolved: Boolean(row.is_resolved), createdAt: row.created_at, resolvedAt: row.resolved_at }; }
function mapTransfer(row: any): InventoryTransfer { return { id: row.id, companyId: row.company_id, sourceLocationId: row.source_location_id, destinationLocationId: row.destination_location_id, status: row.status, requestedByCompanyUserId: row.requested_by_company_user_id, reviewedByCompanyUserId: row.reviewed_by_company_user_id, receivedByCompanyUserId: row.received_by_company_user_id, note: row.note, decisionNote: row.decision_note, requestedAt: row.requested_at, approvedAt: row.approved_at, receivedAt: row.received_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapMovement(row: any): StockMovement { return { id: row.id, companyId: row.company_id, productId: row.product_id, stockLotId: row.stock_lot_id, locationId: row.location_id, movementType: row.movement_type, quantityDelta: Number(row.quantity_delta || 0), referenceType: row.reference_type, referenceId: row.reference_id, reason: row.reason, createdByAuthUserId: row.created_by_auth_user_id, createdAt: row.created_at }; }
function mapTask(row: any): StockTask { return { id: row.id, companyId: row.company_id, locationId: row.location_id, taskType: row.task_type, title: row.title, status: row.status, assignedToCompanyUserId: row.assigned_to_company_user_id, createdByCompanyUserId: row.created_by_company_user_id, notes: row.notes, scheduledStartAt: row.scheduled_start_at, scheduledEndAt: row.scheduled_end_at, startedAt: row.started_at, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapTaskItem(row: any): StockTaskItem { return { id: row.id, taskId: row.task_id, productId: row.product_id, stockLotId: row.stock_lot_id, countedQuantity: row.counted_quantity == null ? null : Number(row.counted_quantity), observedExpiryDate: row.observed_expiry_date, note: row.note, status: row.status, completedAt: row.completed_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapTaskExpected(row: any): StockTaskExpected { return { taskItemId: row.task_item_id, expectedQuantity: row.expected_quantity == null ? null : Number(row.expected_quantity), expectedExpiryDate: row.expected_expiry_date }; }
function mapActivityLog(row: any): StockActivityLog { return { id: row.id, companyId: row.company_id, locationId: row.location_id, actorCompanyUserId: row.actor_company_user_id, entityType: row.entity_type, entityId: row.entity_id, action: row.action, summary: row.summary, metadata: row.metadata, createdAt: row.created_at }; }
function mapAttendanceShift(row: any): AttendanceShift { return { id: row.id, companyId: row.company_id, locationId: row.location_id, companyUserId: row.company_user_id, shiftDate: row.shift_date, clockInAt: row.clock_in_at, clockOutAt: row.clock_out_at, totalMinutes: row.total_minutes == null ? null : Number(row.total_minutes), status: row.status, punchInMethod: row.punch_in_method, punchOutMethod: row.punch_out_method, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapLeaveRequest(row: any): LeaveRequest { return { id: row.id, companyId: row.company_id, companyUserId: row.company_user_id, approverCompanyUserId: row.approver_company_user_id, taskId: row.task_id, leaveType: row.leave_type, startDate: row.start_date, endDate: row.end_date, daysCount: Number(row.days_count || 0), reason: row.reason, status: row.status, managerNote: row.manager_note, reviewedAt: row.reviewed_at, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapLeaveBalance(row: any): LeaveBalance { return { id: row.id, companyId: row.company_id, companyUserId: row.company_user_id, year: Number(row.year || new Date().getFullYear()), ptoAllowance: Number(row.pto_allowance || 0), ptoUsed: Number(row.pto_used || 0), sickAllowance: Number(row.sick_allowance || 0), sickUsed: Number(row.sick_used || 0), createdAt: row.created_at, updatedAt: row.updated_at }; }

export interface PlatformContextValue {
  loading: boolean;
  unauthorizedTenant?: {
    requestedTenantCode: string;
    requestedCompanyName?: string;
    userCompanyName?: string;
    userCompanyCode?: string;
  } | null;
  userEmail: string | null;
  userName: string | null;
  userTitle: string | null;
  userAvatarUrl: string | null;
  userRole: CompanyUserRole;
  companyUserId: string | null;
  companyId: string;
  company: any;
  locations: Location[];
  visibleLocations: Location[];
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  locationScope: string;
  locationName: string;
  products: Product[];
  lots: StockLot[];
  scopedLots: StockLot[];
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  requests: SupplierRequest[];
  transfers: InventoryTransfer[];
  counts: any[];
  movements: StockMovement[];
  teamMembers: any[];
  teamAssignments: any[];
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  activityLogs: StockActivityLog[];
  metrics: {
    expiredLots: number;
    expiringLots: number;
    lowStockProducts: number;
    pendingTransfers: number;
    supplierRequests: number;
    openCounts: number;
  };
  notificationItems: NotificationQueueItem[];
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  taskScanQuery: string;
  setTaskScanQuery: (query: string) => void;
  transferProductId?: string;
  setTransferProductId: (id?: string) => void;
  supplierProductId?: string;
  setSupplierProductId: (id?: string) => void;
  activeTab: string;
  tenantPrefix: string;
  supplierTab: 'suppliers' | 'requests';
  setSupplierTab: (tab: 'suppliers' | 'requests') => void;
  taskTab: 'ongoing' | 'completed';
  setTaskTab: (tab: 'ongoing' | 'completed') => void;
  attendanceTab: 'timesheets' | 'calendar' | 'leaves' | 'kiosk';
  setAttendanceTab: (tab: 'timesheets' | 'calendar' | 'leaves' | 'kiosk') => void;
  userPermissions: {
    pages?: string[];
    capabilities?: {
      can_edit_stock?: boolean;
      can_approve_transfers?: boolean;
      can_manage_team?: boolean;
      can_manage_attendance?: boolean;
    };
  } | null;
  canManage: boolean;
  canManageTasks: boolean;
  canEditStock: boolean;
  canApproveTransfers: boolean;
  canManageAttendance: boolean;
  canManageTeam: boolean;
  navigateToTab: (tab: string) => void;
  refresh: () => void;
  // Drawers
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  openScanner: () => void;
  closeScanner: () => void;
  receiveOpen: boolean;
  setReceiveOpen: (open: boolean) => void;
  receiveProductId?: string;
  receiveProductSearch?: string;
  openReceive: (productId?: string, productSearch?: string) => void;
  productEditOpen: boolean;
  setProductEditOpen: (open: boolean) => void;
  editingProduct: Product | null;
  openProductEdit: (product: Product) => void;
  closeProductEdit: () => void;
  updateProduct: (product: Product, input: { name: string; barcode: string; categoryName: string; unitName: string; reorderPoint: number; defaultExpiryNotificationDays: number | null; defaultSupplierId: string | null; unitCost: number; imageUrl?: string | null }) => Promise<void>;
  deleteProduct: (product: Product) => Promise<void>;
  resolveExpiry: (lot: StockLot, action: 'hold' | 'dispose' | 'return' | 'replace', reason?: string) => Promise<void>;
  updateLotDetails: (lot: StockLot, input: { lotNumber?: string; expiryDate: string; notificationDays: number }) => Promise<void>;
  updateLotRecord: (lot: StockLot, input: StockLotUpdateInput) => Promise<void>;
  deleteLot: (lot: StockLot) => Promise<void>;
  createSupplierRequest: (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => Promise<void>;
  createSupplier: (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string; imageUrl?: string }) => Promise<Supplier>;
  createSupplierContact: (input: SupplierContactInput) => Promise<void>;
  updateSupplierContact: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  setPrimarySupplierContact: (contact: SupplierContact) => Promise<void>;
  deleteSupplierContact: (contact: SupplierContact) => Promise<void>;
  linkSupplierProduct: (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => Promise<void>;
  unlinkSupplierProduct: (supplierProductId: string) => Promise<void>;
  exportStock: () => void;
  updateSupplierRequest: (request: SupplierRequest, status: SupplierRequest['status']) => Promise<void>;
  createTransfer: (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => Promise<void>;
  approveTransfer: (transfer: InventoryTransfer) => Promise<void>;
  receiveTransfer: (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => Promise<void>;
  createLocation: (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => Promise<void>;
  updateLocation: (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => Promise<void>;
  assignLocation: (userId: string, locationId: string) => Promise<void>;
  unassignLocation: (assignmentId: string) => Promise<void>;
  inviteMember: (input: { email: string; fullName?: string; role: CompanyUserRole; locationId?: string }) => Promise<void>;
  updateMemberRole: (memberId: string, role: CompanyUserRole) => Promise<void>;
  updateMemberDetails: (memberId: string, input: { fullName?: string; jobTitle?: string; role?: CompanyUserRole; reportsTo?: string | null; permissions?: Record<string, any> }) => Promise<void>;
  createStockTask: (input: CreateStockTaskCommand) => Promise<void>;
  startStockTask: (taskId: string) => Promise<void>;
  submitStockTask: (taskId: string, items: SubmitStockTaskCommand['items']) => Promise<void>;
  reviewStockTask: (taskId: string, approve: boolean, note?: string) => Promise<void>;
  // Attendance & Leaves
  attendanceShifts: AttendanceShift[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  punchAttendance: (input: { locationId: string; method?: PunchMethod; qrToken?: string; notes?: string }) => Promise<AttendanceShift>;
  submitLeaveRequest: (input: { leaveType: LeaveType; startDate: string; endDate: string; daysCount: number; managerUserId: string; reason?: string }) => Promise<void>;
  reviewLeaveRequest: (requestId: string, approve: boolean, note?: string) => Promise<void>;
}

const PlatformContext = createContext<PlatformContextValue | null>(null);

export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}

export function useOptionalPlatform(): PlatformContextValue | null {
  return useContext(PlatformContext);
}

export interface PlatformProviderProps {
  children: React.ReactNode;
  tenantPrefix?: string;
  initialTenantCode?: string;
}

export function PlatformProvider({
  children,
  tenantPrefix = '/platform',
  initialTenantCode,
}: PlatformProviderProps) {
  const router = useRouter();
  const pathname = usePathname() || '/platform';
  const activeTab = getTabFromPathname(pathname);

  const clientTenant = useMemo(() => {
    if (initialTenantCode) {
      return { code: initialTenantCode, prefix: tenantPrefix };
    }
    if (typeof window === 'undefined') {
      return { code: null, prefix: tenantPrefix };
    }
    const { subdomain } = parseTenantDomain(window.location.hostname);
    if (subdomain) {
      return { code: subdomain, prefix: '' };
    }
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length > 0) {
      const first = segments[0].toLowerCase();
      const reserved = ['platform', 'admin', 'auth', 'onboarding', 'verification-pending', 'api', '_next'];
      if (!reserved.includes(first) && !first.includes('.')) {
        return { code: first, prefix: `/${first}` };
      }
    }
    return { code: null, prefix: tenantPrefix };
  }, [initialTenantCode, pathname, tenantPrefix]);

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userTitle, setUserTitle] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<CompanyUserRole>('staff');
  const [userPermissions, setUserPermissions] = useState<PlatformContextValue['userPermissions']>(null);
  const [unauthorizedTenant, setUnauthorizedTenant] = useState<PlatformContextValue['unauthorizedTenant']>(null);
  const [companyUserId, setCompanyUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [company, setCompany] = useState<any>(null);

  const effectiveTenantPrefix = useMemo(() => {
    if (clientTenant.prefix && clientTenant.prefix !== '/platform') {
      return clientTenant.prefix;
    }
    if (company?.code) {
      if (typeof window !== 'undefined') {
        const { subdomain } = parseTenantDomain(window.location.hostname);
        if (subdomain) {
          return '';
        }
      }
      return `/${company.code.toLowerCase()}`;
    }
    return clientTenant.prefix;
  }, [clientTenant.prefix, company?.code]);

  const effectiveTenantCode = clientTenant.code || (company?.code ? company.code.toLowerCase() : null);
  const [assignedLocationIds, setAssignedLocationIds] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lots, setLots] = useState<StockLot[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierContacts, setSupplierContacts] = useState<SupplierContact[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [counts, setCounts] = useState<any[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const openNotifications = useCallback(() => setNotificationsOpen(true), []);
  const closeNotifications = useCallback(() => setNotificationsOpen(false), []);
  const [scannerOpen, setScannerOpen] = useState(false);
  const openScanner = useCallback(() => setScannerOpen(true), []);
  const closeScanner = useCallback(() => setScannerOpen(false), []);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveProductId, setReceiveProductId] = useState<string | undefined>();
  const [receiveProductSearch, setReceiveProductSearch] = useState<string | undefined>();
  const [productEditOpen, setProductEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [taskScanQuery, setTaskScanQuery] = useState('');
  const [persistedNotifications, setPersistedNotifications] = useState<NotificationTask[]>([]);
  const [notificationSyncAvailable, setNotificationSyncAvailable] = useState(false);
  const [transferProductId, setTransferProductId] = useState<string | undefined>();
  const [supplierProductId, setSupplierProductId] = useState<string | undefined>();
  const [supplierTab, setSupplierTab] = useState<'suppliers' | 'requests'>('suppliers');
  const [taskTab, setTaskTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [attendanceTab, setAttendanceTab] = useState<'timesheets' | 'calendar' | 'leaves' | 'kiosk'>('timesheets');
  const [tasks, setTasks] = useState<StockTask[]>([]);
  const [taskItems, setTaskItems] = useState<StockTaskItem[]>([]);
  const [taskExpected, setTaskExpected] = useState<StockTaskExpected[]>([]);
  const [activityLogs, setActivityLogs] = useState<StockActivityLog[]>([]);
  const [attendanceShifts, setAttendanceShifts] = useState<AttendanceShift[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  const refresh = () => setReloadKey((value) => value + 1);

  const navigateToTab = useCallback((tab: string) => {
    if (tab === 'supplier-requests') {
      setSupplierTab('requests');
      if (activeTab !== 'suppliers') {
        const path = TAB_TO_PATH.suppliers;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (tab === 'suppliers') {
      setSupplierTab('suppliers');
    }
    if (tab === 'tasks-completed') {
      setTaskTab('completed');
      if (activeTab !== 'tasks') {
        const path = TAB_TO_PATH.tasks;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (tab === 'tasks') {
      setTaskTab('ongoing');
    }
    if (tab === 'attendance-calendar' || tab === 'calendar') {
      if (!canOpenTab(userRole, 'attendance', userPermissions)) return;
      setAttendanceTab('calendar');
      if (activeTab !== 'attendance') {
        const path = TAB_TO_PATH.attendance;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (tab === 'attendance-leaves' || tab === 'leaves') {
      if (!canOpenTab(userRole, 'attendance', userPermissions)) return;
      setAttendanceTab('calendar');
      if (activeTab !== 'attendance') {
        const path = TAB_TO_PATH.attendance;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (tab === 'attendance-kiosk' || tab === 'kiosk') {
      navigateToTab('locations');
      return;
    }
    if (tab === 'attendance-timesheets' || tab === 'timesheets') {
      if (!canOpenTab(userRole, 'attendance', userPermissions)) return;
      setAttendanceTab('timesheets');
      if (activeTab !== 'attendance') {
        const path = TAB_TO_PATH.attendance;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (tab === 'attendance') {
      if (!canOpenTab(userRole, 'attendance', userPermissions)) return;
      if (activeTab !== 'attendance') {
        const path = TAB_TO_PATH.attendance;
        const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
          ? path
          : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
        React.startTransition(() => {
          router.push(targetHref || '/');
        });
      }
      return;
    }
    if (!canOpenTab(userRole, tab, userPermissions)) return;
    const path = TAB_TO_PATH[tab] || `/platform/${tab}`;
    const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
      ? path
      : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
    React.startTransition(() => {
      router.push(targetHref || '/');
    });
  }, [userRole, userPermissions, effectiveTenantPrefix, router, activeTab]);

  // Warm client router cache so all platform transitions feel instantaneous
  useEffect(() => {
    Object.values(TAB_TO_PATH).forEach((path) => {
      const targetHref = (!effectiveTenantPrefix || effectiveTenantPrefix === '/platform')
        ? path
        : (path === '/platform' ? effectiveTenantPrefix : path.replace('/platform', effectiveTenantPrefix));
      router.prefetch(targetHref);
    });
  }, [router, effectiveTenantPrefix]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setUnauthorizedTenant(null);
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) console.error('Unable to restore the Stocky session', authError);
      const user = auth.user;
      if (!user) { setLoading(false); router.replace('/'); return; }
      setUserEmail(user.email || null);
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null);
      setUserTitle(user.user_metadata?.job_title || user.user_metadata?.title || 'Team member');
      setUserAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);

      let targetCompanyId: string | null = null;
      let requestedCompany: any = null;
      if (clientTenant.code) {
        const { data: tenantCompany } = await supabase
          .from('companies')
          .select('*')
          .ilike('code', clientTenant.code)
          .maybeSingle();
        if (tenantCompany) {
          targetCompanyId = tenantCompany.id;
          requestedCompany = tenantCompany;
        }
      }

      // Check all memberships for the signed-in user
      const { data: authMemberships, error: authMembershipError } = await supabase
        .from('company_users')
        .select('*, company:companies(*)')
        .eq('auth_user_id', user.id);
      if (authMembershipError) console.error('Unable to load memberships', authMembershipError);

      let userMemberships = authMemberships || [];
      if (userMemberships.length === 0 && user.email) {
        const { data: emailMemberships, error: emailMembershipError } = await supabase
          .from('company_users')
          .select('*, company:companies(*)')
          .eq('email', user.email.toLowerCase());
        if (emailMembershipError) console.error('Unable to load email memberships', emailMembershipError);
        userMemberships = emailMemberships || [];
      }

      // If user has zero company memberships anywhere in Stocky:
      if (userMemberships.length === 0) {
        setLoading(false);
        router.replace('/onboarding');
        return;
      }

      // If a specific tenant code was visited (e.g. /circlek or circlek.stocky.app):
      let profile = null;
      if (targetCompanyId) {
        profile = userMemberships.find((m) => m.company_id === targetCompanyId) ?? null;
        if (!profile) {
          // Cross-company access violation!
          const primaryComp = userMemberships[0]?.company;
          const requestedCode = clientTenant.code || '';
          setUnauthorizedTenant({
            requestedTenantCode: requestedCode,
            requestedCompanyName: requestedCompany?.name || requestedCode.toUpperCase(),
            userCompanyName: primaryComp?.name || 'Your Company',
            userCompanyCode: primaryComp?.code?.toLowerCase() || 'platform',
          });
          setLoading(false);
          return;
        }
      } else {
        profile = userMemberships[0];
      }

      if (!profile?.company_id) { setLoading(false); router.replace('/onboarding'); return; }
      if (profile.status && profile.status !== 'active') { setLoading(false); router.replace('/verification-pending'); return; }
      
      const role = profile.role as CompanyUserRole;
      setCompanyUserId(profile.id);
      setUserRole(role);
      setCompanyId(profile.company_id);
      setUserName(profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null);
      setUserTitle(profile.job_title || roleTitles[role] || 'Team member');
      setUserAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
      setUserPermissions(profile.permissions || null);

      const { data: comp } = await supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle();
      if (comp) {
        if (comp.status && comp.status !== 'verified') { router.replace('/verification-pending'); return; }
        let companyLogoUrl = comp.logo_url;
        if (companyLogoUrl && !companyLogoUrl.startsWith('http')) {
          const { data: signedLogo } = await supabase.storage.from('stocky-private').createSignedUrl(companyLogoUrl, 60 * 60);
          companyLogoUrl = signedLogo?.signedUrl || null;
        }
        setCompany({ ...comp, logo_url: companyLogoUrl });

        // Automatically upgrade generic /platform URL to the company's tenant path in the address bar
        if (comp.code) {
          const companySlug = comp.code.toLowerCase();
          const isSubdomain =
            typeof window !== 'undefined' &&
            Boolean(parseTenantDomain(window.location.hostname).subdomain);

          const currentPath = typeof window !== 'undefined' ? window.location.pathname : pathname;
          if (currentPath === '/platform' || currentPath.startsWith('/platform/')) {
            const tenantUrl = isSubdomain
              ? (currentPath === '/platform' ? '/' : currentPath.replace('/platform', ''))
              : (currentPath === '/platform' ? `/${companySlug}` : currentPath.replace('/platform', `/${companySlug}`));
            router.replace(tenantUrl);
          }
        }
      }

      const { data: syncedNotifications, error: notificationSyncError } = await supabase.rpc('sync_stocky_notifications');
      if (notificationSyncError) console.warn('Notification sync unavailable; using live action queue', notificationSyncError.message);
      setNotificationSyncAvailable(!notificationSyncError);

      const [
        { data: dbLocations },
        { data: userLocations },
        { data: dbProducts },
        { data: dbLots },
        { data: dbSuppliers },
        { data: dbSupplierContacts },
        { data: dbSupplierProducts },
        { data: dbRequests },
        { data: dbTransfers },
        { data: dbCounts },
        { data: dbCountLines },
        { data: dbTeam },
        { data: dbMovements },
        { data: dbTasks },
        { data: dbTaskItems },
        { data: dbTaskExpected },
        { data: dbActivityLogs },
        { data: dbAttendanceShifts },
        { data: dbLeaveRequests },
        { data: dbLeaveBalances },
      ] = await Promise.all([
        supabase.from('locations').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('user_locations').select('location_id').eq('user_id', profile.id),
        supabase.from('products').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('stock_lots').select('*').eq('company_id', profile.company_id).order('expiry_date', { ascending: true, nullsFirst: false }),
        supabase.from('suppliers').select('*').eq('company_id', profile.company_id).order('name'),
        supabase.from('supplier_contacts').select('*').eq('company_id', profile.company_id).order('is_primary', { ascending: false }).order('name'),
        supabase.from('supplier_products').select('*').eq('company_id', profile.company_id),
        supabase.from('supplier_requests').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_transfers').select('*').eq('company_id', profile.company_id).order('requested_at', { ascending: false }),
        supabase.from('stock_count_sessions').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_count_lines').select('*').order('created_at', { ascending: true }),
        supabase.from('company_users').select('id,email,full_name,avatar_url,role,status,job_title,reports_to,permissions').eq('company_id', profile.company_id).order('full_name'),
        supabase.from('stock_movements').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(300),
        supabase.from('stock_tasks').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_task_items').select('id,task_id,product_id,stock_lot_id,counted_quantity,observed_expiry_date,note,status,completed_at,created_at,updated_at').eq('company_id', profile.company_id).order('created_at', { ascending: true }),
        supabase.from('stock_task_expected').select('*'),
        supabase.from('stock_activity_logs').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(500),
        supabase.from('attendance_shifts').select('*').eq('company_id', profile.company_id).order('clock_in_at', { ascending: false }).limit(500),
        supabase.from('leave_requests').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('leave_balances').select('*').eq('company_id', profile.company_id),
      ]);

      if (cancelled) return;
      const nextLocations = await Promise.all(
        (dbLocations || []).map(async (row: any) => {
          let imageUrl = row.image_url || null;
          if (imageUrl && !imageUrl.startsWith('http')) {
            try {
              const { data: signed } = await supabase.storage
                .from('stocky-private')
                .createSignedUrl(imageUrl, 60 * 60 * 24 * 365);
              if (signed?.signedUrl) {
                imageUrl = signed.signedUrl;
              }
            } catch {
              // Ignore signing error and fallback to stored path
            }
          }
          return { ...mapLocation(row), imageUrl };
        })
      );
      const { data: dbAssignments } = await supabase.from('user_locations').select('id,user_id,location_id');
      const nextAssigned = Array.from(new Set([...(userLocations || []).map((row: any) => row.location_id), ...nextLocations.filter((location) => location.managerUserId === profile.id).map((location) => location.id)]));
      const countLinesBySession = new Map<string, any[]>();
      (dbCountLines || []).forEach((line: any) => {
        const current = countLinesBySession.get(line.session_id) || [];
        current.push(line);
        countLinesBySession.set(line.session_id, current);
      });

      setAssignedLocationIds(nextAssigned);
      setLocations(nextLocations);
      const nextProducts = await Promise.all(
        (dbProducts || []).map(async (row: any) => {
          let imageUrl = row.image_url || null;
          if (imageUrl && !imageUrl.startsWith('http')) {
            try {
              const { data: signed } = await supabase.storage
                .from('stocky-private')
                .createSignedUrl(imageUrl, 60 * 60 * 24 * 365);
              if (signed?.signedUrl) {
                imageUrl = signed.signedUrl;
              }
            } catch {
              // fallback
            }
          }
          return { ...mapProduct(row), imageUrl };
        })
      );
      setProducts(nextProducts);
      setLots((dbLots || []).map(mapLot));
      setSuppliers((dbSuppliers || []).map(mapSupplier));
      setSupplierContacts((dbSupplierContacts || []).map(mapSupplierContact));
      setSupplierProducts((dbSupplierProducts || []).map(mapSupplierProduct));
      setRequests((dbRequests || []).map(mapRequest));
      setTransfers((dbTransfers || []).map(mapTransfer));
      setCounts((dbCounts || []).map((count: any) => ({ ...count, lines: countLinesBySession.get(count.id) || [] })));
      setTeamMembers(dbTeam || []);
      setTeamAssignments(dbAssignments || []);
      setMovements((dbMovements || []).map(mapMovement));
      setTasks((dbTasks || []).map(mapTask));
      setTaskItems((dbTaskItems || []).map(mapTaskItem));
      setTaskExpected((dbTaskExpected || []).map(mapTaskExpected));
      setActivityLogs((dbActivityLogs || []).map(mapActivityLog));
      setPersistedNotifications((syncedNotifications || []).map(mapNotification));
      setAttendanceShifts((dbAttendanceShifts || []).map(mapAttendanceShift));
      setLeaveRequests((dbLeaveRequests || []).map(mapLeaveRequest));
      setLeaveBalances((dbLeaveBalances || []).map(mapLeaveBalance));

      const visible = adminRoles.includes(role) ? nextLocations : nextLocations.filter((location) => nextAssigned.includes(location.id));
      if (!adminRoles.includes(role) && visible.length > 0) {
        setSelectedLocationId((current) => visible.some((location) => location.id === current) ? current : visible[0].id);
      }
      if (adminRoles.includes(role)) {
        setSelectedLocationId((current) => current || 'all');
      }
      setLoading(false);
    }

    load().catch((error) => {
      console.error('Failed to load workspace data', error);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [reloadKey, router, clientTenant.code]);

  const visibleLocations = useMemo(
    () => adminRoles.includes(userRole) ? locations : locations.filter((location) => assignedLocationIds.includes(location.id)),
    [assignedLocationIds, locations, userRole]
  );

  const locationScope = selectedLocationId === 'all' && adminRoles.includes(userRole)
    ? 'all'
    : (selectedLocationId === 'all' ? visibleLocations[0]?.id || '' : selectedLocationId);

  const scopedLots = useMemo(
    () => lots.filter((lot) => locationScope === 'all' || lot.locationId === locationScope),
    [locationScope, lots]
  );

  const locationName = locationScope === 'all'
    ? 'All locations'
    : visibleLocations.find((location) => location.id === locationScope)?.name || 'Your location';

  const metrics = useMemo(() => {
    const today = Date.now();
    const expiry = scopedLots
      .filter((lot) => lot.quantityOnHand > 0 && lot.expiryDate)
      .map((lot) => ({ lot, days: Math.ceil((new Date(lot.expiryDate as string).getTime() - today) / 86400000) }));
    const productTotals = new Map<string, number>();
    scopedLots.forEach((lot) => productTotals.set(lot.productId, (productTotals.get(lot.productId) || 0) + lot.quantityOnHand));
    return {
      expiredLots: expiry.filter(({ days }) => days < 0).length,
      expiringLots: expiry.filter(({ lot, days }) => days >= 0 && days <= (lot.expiryNotificationDays ?? 0)).length,
      lowStockProducts: products.filter((product) => (productTotals.get(product.id) || 0) <= product.reorderPoint).length,
      pendingTransfers: transfers.filter((transfer) => ['requested', 'approved', 'in_transit', 'partially_received'].includes(transfer.status)).length,
      supplierRequests: requests.filter((request) => !['closed', 'cancelled'].includes(request.status)).length,
      openCounts: tasks.filter((task) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status)).length,
    };
  }, [products, requests, scopedLots, tasks, transfers]);

  const liveNotificationItems = useMemo<NotificationQueueItem[]>(() => {
    const today = Date.now();
    const productMap = new Map(products.map((product) => [product.id, product]));
    const locationMap = new Map(visibleLocations.map((location) => [location.id, location]));
    const items: NotificationQueueItem[] = [];

    // Expiry notifications
    scopedLots
      .filter((lot) => lot.quantityOnHand > 0 && lot.expiryDate)
      .map((lot) => ({ lot, days: Math.ceil((new Date(lot.expiryDate as string).getTime() - today) / 86400000) }))
      .filter(({ lot, days }) => days < 0 || days <= (lot.expiryNotificationDays ?? 0))
      .slice(0, 8)
      .forEach(({ lot, days }, index) => {
        const product = productMap.get(lot.productId);
        const locationName = locationMap.get(lot.locationId)?.name || 'your location';
        const isCritical = days < 0;
        items.push({
          id: `expiry-${lot.id}`,
          title: isCritical ? `${product?.name || 'Product'} is expired` : `${product?.name || 'Product'} is expiring soon`,
          entityName: product?.name || 'Stock Item',
          message: isCritical
            ? `Expired by ${Math.abs(days)}d (${lot.quantityOnHand} units at ${locationName}) · Batch ${lot.lotNumber || 'N/A'}`
            : `Expires in ${days}d (${lot.quantityOnHand} units at ${locationName}) · Batch ${lot.lotNumber || 'N/A'}`,
          actionLabel: 'Review',
          severity: isCritical ? 'critical' : 'warning',
          type: 'expiry',
          imageUrl: product?.imageUrl || null,
          timestamp: index === 0 ? '10m ago' : index === 1 ? '45m ago' : 'Today',
          isRead: false,
          onOpen: () => navigateToTab('expiry'),
        });
      });

    // Low stock notifications
    products
      .filter((product) => scopedLots.filter((lot) => lot.productId === product.id).reduce((sum, lot) => sum + lot.quantityOnHand, 0) <= product.reorderPoint)
      .slice(0, 5)
      .forEach((product, index) => {
        items.push({
          id: `low-${product.id}`,
          title: `${product.name} is low on stock`,
          entityName: product.name,
          message: `Stock is at or below the reorder point of ${product.reorderPoint} ${product.unitName}. Reorder recommended.`,
          actionLabel: 'Open stock',
          severity: 'warning',
          type: 'low_stock',
          imageUrl: product.imageUrl || null,
          timestamp: index === 0 ? '1h ago' : '2h ago',
          isRead: false,
          onOpen: () => navigateToTab('stock'),
        });
      });

    // Transfer notifications
    if (canOpenTab(userRole, 'transfers')) {
      transfers
        .filter((transfer) => ['requested', 'approved', 'in_transit', 'partially_received'].includes(transfer.status))
        .slice(0, 5)
        .forEach((transfer, index) => {
          const statusLabel = transfer.status.replace('_', ' ');
          items.push({
            id: `transfer-${transfer.id}`,
            title: `Transfer #${transfer.id.slice(0, 6).toUpperCase()} needs attention`,
            entityName: `Transfer #${transfer.id.slice(0, 6).toUpperCase()}`,
            message: `Status updated to ${statusLabel}. Review inventory movement details.`,
            actionLabel: 'Open transfers',
            severity: 'info',
            type: 'transfer',
            timestamp: index === 0 ? '3h ago' : 'Earlier today',
            isRead: index > 0,
            onOpen: () => navigateToTab('transfers'),
          });
        });
    }

    // Supplier notifications
    if (canOpenTab(userRole, 'suppliers')) {
      requests
        .filter((request) => !['closed', 'cancelled'].includes(request.status))
        .slice(0, 5)
        .forEach((request) => {
          items.push({
            id: `supplier-${request.id}`,
            title: 'Supplier follow-up needed',
            entityName: 'Purchase Request',
            message: `${request.requestType} request is currently ${request.status}. Follow up with supplier.`,
            actionLabel: 'Open suppliers',
            severity: 'info',
            type: 'supplier',
            timestamp: 'Yesterday',
            isRead: true,
            onOpen: () => navigateToTab('suppliers'),
          });
        });
    }

    // Task notifications
    if (canOpenTab(userRole, 'tasks')) {
      tasks
        .filter((task) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status))
        .slice(0, 5)
        .forEach((task) => {
          const locName = locationMap.get(task.locationId)?.name || 'Location';
          items.push({
            id: `task-${task.id}`,
            title: task.taskType === 'count' ? 'Stock count task update' : 'Expiry audit task update',
            entityName: task.taskType === 'count' ? 'Stock Count Task' : 'Expiry Audit Task',
            message: `${task.status.replace('_', ' ')} at ${locName}. Action required.`,
            actionLabel: 'Open tasks',
            severity: 'info',
            type: 'task',
            timestamp: 'Yesterday',
            isRead: true,
            onOpen: () => navigateToTab('tasks'),
          });
        });
    }

    return items;
  }, [products, requests, scopedLots, tasks, transfers, userRole, visibleLocations]);

  const notificationItems = useMemo<NotificationQueueItem[]>(() => {
    if (!notificationSyncAvailable) return liveNotificationItems;
    const targetTab: Record<NotificationTask['notificationType'], string> = {
      expiry: 'expiry',
      data_quality: 'expiry',
      low_stock: 'stock',
      transfer: 'transfers',
      count_review: 'tasks',
      supplier_request: 'suppliers',
    };
    const actionLabel: Record<NotificationTask['notificationType'], string> = {
      expiry: 'Review',
      data_quality: 'Complete',
      low_stock: 'Open stock',
      transfer: 'Open transfers',
      count_review: 'Open tasks',
      supplier_request: 'Open suppliers',
    };
    const typeMapping: Record<NotificationTask['notificationType'], NotificationType> = {
      expiry: 'expiry',
      data_quality: 'expiry',
      low_stock: 'low_stock',
      transfer: 'transfer',
      count_review: 'task',
      supplier_request: 'supplier',
    };
    return persistedNotifications.filter((notification) => canOpenTab(userRole, targetTab[notification.notificationType])).map((notification) => ({
      id: notification.id,
      title: notification.title,
      entityName: notification.title.split(' ')[0] || 'Notification',
      message: notification.message || 'This item needs attention.',
      actionLabel: actionLabel[notification.notificationType],
      severity: notification.severity,
      type: typeMapping[notification.notificationType] || 'system',
      timestamp: 'Today',
      isRead: Boolean(notification.isRead),
      onOpen: () => {
        void supabase.rpc('mark_stocky_notification_read', { p_notification_id: notification.id });
        const nextTab = targetTab[notification.notificationType];
        if (canOpenTab(userRole, nextTab)) navigateToTab(nextTab);
      },
    }));
  }, [liveNotificationItems, notificationSyncAvailable, persistedNotifications, userRole]);

  const openReceive = (productId?: string, productSearch?: string) => {
    setReceiveProductId(productId);
    setReceiveProductSearch(productSearch);
    setReceiveOpen(true);
  };

  const openProductEdit = (product: Product) => {
    setEditingProduct(product);
    setProductEditOpen(true);
  };

  const closeProductEdit = () => {
    setProductEditOpen(false);
    setEditingProduct(null);
  };

  const updateProduct = async (product: Product, input: { name: string; barcode: string; categoryName: string; unitName: string; reorderPoint: number; defaultExpiryNotificationDays: number | null; defaultSupplierId: string | null; unitCost: number; imageUrl?: string | null }) => {
    const patch: any = {
      name: input.name,
      barcode: input.barcode || null,
      category_name: input.categoryName,
      unit_name: input.unitName,
      reorder_point: input.reorderPoint,
      default_expiry_notification_days: input.defaultExpiryNotificationDays,
      default_supplier_id: input.defaultSupplierId,
      unit_cost: input.unitCost,
      updated_at: new Date().toISOString(),
    };
    if (input.imageUrl !== undefined) {
      patch.image_url = input.imageUrl || null;
    }
    const { data, error } = await supabase.from('products').update(patch).eq('id', product.id).eq('company_id', companyId).select('*').single();
    if (error || !data) throw error || new Error('The product could not be saved.');
    setProducts((current) => current.map((item) => item.id === product.id ? mapProduct(data) : item));
    refresh();
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Archive “${product.name}”? Its stock history will be preserved.`)) return;
    const { error } = await supabase.from('products').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', product.id).eq('company_id', companyId);
    if (error) alert(error.message);
    else {
      setProducts((current) => current.filter((item) => item.id !== product.id));
      refresh();
    }
  };

  const resolveExpiry = async (lot: StockLot, action: 'hold' | 'dispose' | 'return' | 'replace', reason?: string) => {
    const { error } = await supabase.rpc('resolve_expiry_action', { p_lot_id: lot.id, p_action: action, p_reason: reason || 'Resolved from the expiry queue' });
    if (error) alert(error.message);
    else refresh();
  };

  const updateLotDetails = async (lot: StockLot, input: { lotNumber?: string; expiryDate: string; notificationDays: number }) => {
    const { error } = await supabase.rpc('update_stock_lot_details', { p_lot_id: lot.id, p_lot_number: input.lotNumber || null, p_expiry_date: input.expiryDate, p_expiry_notification_days: input.notificationDays });
    if (error) alert(error.message);
    else refresh();
  };

  const updateLotRecord = async (lot: StockLot, input: StockLotUpdateInput) => {
    const { data, error } = await supabase.rpc('update_stock_lot_record', {
      p_lot_id: lot.id,
      p_lot_number: input.lotNumber || null,
      p_received_at: new Date(`${input.receivedDate}T12:00:00`).toISOString(),
      p_expiry_date: input.expiryDate ? new Date(`${input.expiryDate}T12:00:00`).toISOString() : null,
      p_expiry_notification_days: input.expiryNotificationDays,
      p_supplier_id: input.supplierId,
      p_unit_cost: input.unitCost,
      p_notes: input.notes || null,
    });
    if (error || !data) throw error || new Error('The stock lot could not be saved.');
    setLots((current) => current.map((currentLot) => currentLot.id === lot.id ? mapLot(data) : currentLot));
    refresh();
  };

  const deleteLot = async (lot: StockLot) => {
    const { error } = await supabase.rpc('delete_stock_lot', { p_lot_id: lot.id, p_reason: 'Lot removed from stock actions' });
    if (error) throw error;
    setLots((current) => current.filter((currentLot) => currentLot.id !== lot.id));
    refresh();
  };

  const createSupplierRequest = async (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => {
    const { error } = await supabase.rpc('create_supplier_request', { p_location_id: input.locationId, p_product_id: input.productId, p_request_type: input.requestType, p_quantity: input.quantity || null, p_supplier_id: input.supplierId || null, p_reason: 'Created from Stocky' });
    if (error) alert(error.message);
    else refresh();
  };

  const createSupplier = async (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string; imageUrl?: string }) => {
    const insertPayload: any = { company_id: companyId, name: input.name, address: input.address || null, contact_name: input.contactName, contact_phone: input.contactPhone, contact_email: input.contactEmail || null };
    if (input.imageUrl) insertPayload.image_url = input.imageUrl;
    let { data, error } = await supabase.from('suppliers').insert(insertPayload).select('*').single();
    if (error && input.imageUrl) {
      delete insertPayload.image_url;
      const retry = await supabase.from('suppliers').insert(insertPayload).select('*').single();
      data = retry.data;
      error = retry.error;
    }
    if (error || !data) throw error || new Error('The supplier could not be saved.');
    const { error: contactError } = await supabase.from('supplier_contacts').insert({ company_id: companyId, supplier_id: data.id, name: input.contactName, phone: input.contactPhone, email: input.contactEmail || null, is_primary: true });
    if (contactError) console.warn('Supplier saved without a contact record', contactError.message);
    const createdSupplier = mapSupplier(data);
    setSuppliers((current) => [createdSupplier, ...current.filter((supplier) => supplier.id !== createdSupplier.id)]);
    refresh();
    return createdSupplier;
  };

  const createSupplierContact = async (input: SupplierContactInput) => {
    const shouldBePrimary = input.isPrimary || !supplierContacts.some((contact) => contact.supplierId === input.supplierId && contact.isPrimary);
    if (shouldBePrimary) {
      const { error: clearError } = await supabase.from('supplier_contacts').update({ is_primary: false, updated_at: new Date().toISOString() }).eq('supplier_id', input.supplierId);
      if (clearError) throw clearError;
    }
    const { data, error } = await supabase.from('supplier_contacts').insert({ company_id: companyId, supplier_id: input.supplierId, name: input.name, role: input.role || null, phone: input.phone, email: input.email || null, is_primary: shouldBePrimary }).select('*').single();
    if (error || !data) throw error || new Error('The contact could not be saved.');
    if (shouldBePrimary) {
      const { error: supplierError } = await supabase.from('suppliers').update({ contact_name: input.name, contact_phone: input.phone, contact_email: input.email || null, updated_at: new Date().toISOString() }).eq('id', input.supplierId).eq('company_id', companyId);
      if (supplierError) throw supplierError;
    }
    setSupplierContacts((current) => [...current.filter((contact) => !(shouldBePrimary && contact.supplierId === input.supplierId)), mapSupplierContact(data)]);
    refresh();
  };

  const updateSupplierContact = async (contact: SupplierContact, input: SupplierContactInput) => {
    if (contact.isPrimary && !input.isPrimary && !supplierContacts.some((candidate) => candidate.supplierId === contact.supplierId && candidate.id !== contact.id)) throw new Error('Add another contact before changing the only primary contact.');
    const shouldBePrimary = contact.isPrimary ? true : input.isPrimary;
    if (shouldBePrimary) {
      const { error: clearError } = await supabase.from('supplier_contacts').update({ is_primary: false, updated_at: new Date().toISOString() }).eq('supplier_id', contact.supplierId).neq('id', contact.id);
      if (clearError) throw clearError;
    }
    const { data, error } = await supabase.from('supplier_contacts').update({ name: input.name, role: input.role || null, phone: input.phone, email: input.email || null, is_primary: shouldBePrimary, updated_at: new Date().toISOString() }).eq('id', contact.id).eq('company_id', companyId).select('*').single();
    if (error || !data) throw error || new Error('The contact could not be updated.');
    if (shouldBePrimary) {
      const { error: supplierError } = await supabase.from('suppliers').update({ contact_name: input.name, contact_phone: input.phone, contact_email: input.email || null, updated_at: new Date().toISOString() }).eq('id', contact.supplierId).eq('company_id', companyId);
      if (supplierError) throw supplierError;
    }
    refresh();
  };

  const setPrimarySupplierContact = async (contact: SupplierContact) => {
    if (contact.isPrimary) return;
    const timestamp = new Date().toISOString();
    const { error: clearError } = await supabase.from('supplier_contacts').update({ is_primary: false, updated_at: timestamp }).eq('supplier_id', contact.supplierId);
    if (clearError) throw clearError;
    const { error: primaryError } = await supabase.from('supplier_contacts').update({ is_primary: true, updated_at: timestamp }).eq('id', contact.id).eq('company_id', companyId);
    if (primaryError) throw primaryError;
    const { error: supplierError } = await supabase.from('suppliers').update({ contact_name: contact.name, contact_phone: contact.phone, contact_email: contact.email || null, updated_at: timestamp }).eq('id', contact.supplierId).eq('company_id', companyId);
    if (supplierError) throw supplierError;
    refresh();
  };

  const deleteSupplierContact = async (contact: SupplierContact) => {
    if (contact.isPrimary) {
      const { data: replacement } = await supabase.from('supplier_contacts').select('*').eq('supplier_id', contact.supplierId).neq('id', contact.id).order('created_at').limit(1).maybeSingle();
      if (!replacement) throw new Error('Add another contact before deleting the primary contact.');
      const timestamp = new Date().toISOString();
      const { error: clearError } = await supabase.from('supplier_contacts').update({ is_primary: false, updated_at: timestamp }).eq('supplier_id', contact.supplierId);
      if (clearError) throw clearError;
      const { error: replacementError } = await supabase.from('supplier_contacts').update({ is_primary: true, updated_at: timestamp }).eq('id', replacement.id);
      if (replacementError) throw replacementError;
      const { error: supplierError } = await supabase.from('suppliers').update({ contact_name: replacement.name, contact_phone: replacement.phone, contact_email: replacement.email || null, updated_at: timestamp }).eq('id', contact.supplierId).eq('company_id', companyId);
      if (supplierError) throw supplierError;
    }
    const { error } = await supabase.from('supplier_contacts').delete().eq('id', contact.id).eq('company_id', companyId);
    if (error) throw error;
    refresh();
  };

  const linkSupplierProduct = async (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => {
    const { error } = await supabase.from('supplier_products').upsert({ company_id: companyId, supplier_id: input.supplierId, product_id: input.productId, supplier_sku: input.supplierSku || null, unit_cost: input.unitCost ?? null, updated_at: new Date().toISOString() }, { onConflict: 'company_id,supplier_id,product_id' });
    if (error) throw error;
    refresh();
  };

  const unlinkSupplierProduct = async (supplierProductId: string) => {
    const { error } = await supabase.from('supplier_products').delete().eq('id', supplierProductId);
    if (error) throw error;
    refresh();
  };

  const exportStock = () => {
    const productMap = new Map(products.map((product) => [product.id, product]));
    const locationMap = new Map(visibleLocations.map((location) => [location.id, location]));
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = ['Product', 'Barcode', 'Category', 'Location', 'Batch / lot', 'Quantity', 'Unit', 'Expiry date', 'Notify before (days)', 'Unit cost', 'Status'];
    const rows = lots.filter((lot) => locationScope === 'all' || lot.locationId === locationScope).map((lot) => {
      const product = productMap.get(lot.productId);
      return [product?.name, product?.barcode, product?.categoryName, locationMap.get(lot.locationId)?.name, lot.lotNumber, lot.quantityOnHand, product?.unitName, lot.expiryDate, lot.expiryNotificationDays, lot.unitCost, lot.status].map(escape).join(',');
    });
    const blob = new Blob([[header.map(escape).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stocky-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateSupplierRequest = async (request: SupplierRequest, status: SupplierRequest['status']) => {
    const { error } = await supabase.rpc('update_supplier_request_status', { p_request_id: request.id, p_status: status });
    if (error) alert(error.message);
    else refresh();
  };

  const createTransfer = async (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => {
    const { error } = await supabase.rpc('create_stock_transfer_multi', { p_source_location_id: input.sourceLocationId, p_destination_location_id: input.destinationLocationId, p_lines: input.lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })), p_note: input.note || null });
    if (error) alert(error.message);
    else refresh();
  };

  const approveTransfer = async (transfer: InventoryTransfer) => {
    const { error } = await supabase.rpc('approve_stock_transfer', { p_transfer_id: transfer.id, p_approve: true, p_note: null });
    if (error) alert(error.message);
    else refresh();
  };

  const receiveTransfer = async (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => {
    const { error } = lines
      ? await supabase.rpc('receive_stock_transfer_partial', { p_transfer_id: transfer.id, p_lines: lines.map((line) => ({ line_id: line.lineId, quantity_received: line.quantityReceived })), p_note: note || null })
      : await supabase.rpc('receive_stock_transfer', { p_transfer_id: transfer.id });
    if (error) alert(error.message);
    else refresh();
  };

  const createLocation = async (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => {
    const payload: any = {
      company_id: companyId,
      name: input.name,
      type: input.type,
      address: input.address || null,
      phone: input.phone || null,
      manager_user_id: input.managerUserId || null,
      is_active: true,
    };
    if (input.imageUrl !== undefined) {
      payload.image_url = input.imageUrl || null;
    }
    const { data: created, error } = await supabase.from('locations').insert(payload).select('id').single();
    if (error || !created) {
      if (error) alert(error.message);
      return;
    }
    if (input.managerUserId) {
      const { error: assignmentError } = await supabase.from('user_locations').upsert({ user_id: input.managerUserId, location_id: created.id }, { onConflict: 'user_id,location_id' });
      if (assignmentError) alert(assignmentError.message);
    }
    refresh();
  };

  const updateLocation = async (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => {
    const patch: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.type !== undefined) patch.type = input.type;
    if (input.address !== undefined) patch.address = input.address || null;
    if (input.phone !== undefined) patch.phone = input.phone || null;
    if (input.managerUserId !== undefined) patch.manager_user_id = input.managerUserId || null;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl || null;

    const { error } = await supabase.from('locations').update(patch).eq('id', locationId).eq('company_id', companyId);
    if (error) {
      alert(error.message);
      return;
    }
    if (input.managerUserId) {
      await supabase.from('user_locations').upsert({ user_id: input.managerUserId, location_id: locationId }, { onConflict: 'user_id,location_id' });
    }
    refresh();
  };

  const assignLocation = async (userId: string, locationId: string) => {
    const { error } = await supabase.from('user_locations').insert({ user_id: userId, location_id: locationId });
    if (error) alert(error.message);
    else refresh();
  };

  const unassignLocation = async (assignmentId: string) => {
    const { error } = await supabase.from('user_locations').delete().eq('id', assignmentId);
    if (error) alert(error.message);
    else refresh();
  };

  const inviteMember = async (input: { email: string; fullName?: string; role: CompanyUserRole; locationId?: string }) => {
    if (!companyId) throw new Error('Your company workspace is still loading. Please try again.');
    const email = input.email.trim().toLowerCase();
    const { data: existingMembers, error: existingMemberError } = await supabase
      .from('company_users')
      .select('id,email,status')
      .eq('company_id', companyId)
      .eq('email', email)
      .limit(1);
    if (existingMemberError) throw existingMemberError;
    if (existingMembers?.length) throw new Error('This email is already on your team.');

    const { data, error } = await supabase
      .from('company_users')
      .insert({ company_id: companyId, email, full_name: input.fullName || null, role: input.role, can_edit: true, can_delete: false, status: 'invited' })
      .select('id')
      .single();
    if (error || !data) throw error || new Error('Could not invite this teammate.');

    let createdAssignment: { id: string; user_id: string; location_id: string } | null = null;
    if (input.locationId && (input.role === 'manager' || input.role === 'staff')) {
      const { data: assignment, error: assignmentError } = await supabase
        .from('user_locations')
        .insert({ user_id: data.id, location_id: input.locationId })
        .select('id,user_id,location_id')
        .single();
      if (assignmentError) {
        await supabase.from('company_users').delete().eq('id', data.id).eq('company_id', companyId);
        throw assignmentError;
      }
      createdAssignment = assignment;
    }
    setTeamMembers((current) => [...current, {
      id: data.id,
      email,
      full_name: input.fullName || null,
      role: input.role,
      status: 'invited',
    }]);
    if (createdAssignment) setTeamAssignments((current) => [...current, createdAssignment as { id: string; user_id: string; location_id: string }]);
  };

  const updateMemberRole = async (memberId: string, role: CompanyUserRole) => {
    const { error } = await supabase.from('company_users').update({ role, updated_at: new Date().toISOString() }).eq('id', memberId);
    if (error) alert(error.message);
    else refresh();
  };

  const updateMemberDetails = async (
    memberId: string,
    input: {
      fullName?: string;
      jobTitle?: string;
      role?: CompanyUserRole;
      reportsTo?: string | null;
      permissions?: Record<string, any>;
    }
  ) => {
    const patch: any = { updated_at: new Date().toISOString() };
    if (input.fullName !== undefined) patch.full_name = input.fullName || null;
    if (input.jobTitle !== undefined) patch.job_title = input.jobTitle || null;
    if (input.role !== undefined) patch.role = input.role;
    if (input.reportsTo !== undefined) patch.reports_to = input.reportsTo || null;
    if (input.permissions !== undefined) patch.permissions = input.permissions;

    const { error } = await supabase
      .from('company_users')
      .update(patch)
      .eq('id', memberId)
      .eq('company_id', companyId);

    if (error) {
      alert(error.message);
      return;
    }
    refresh();
  };

  const createStockTask = async (input: CreateStockTaskCommand) => {
    const { error } = await supabase.rpc('create_stock_task', {
      p_location_id: input.locationId,
      p_task_type: input.taskType,
      p_assigned_to_company_user_id: input.assignedToCompanyUserId,
      p_product_ids: input.productIds || [],
      p_note: input.note || null,
      p_scheduled_start_at: input.scheduledStartAt || null,
      p_scheduled_end_at: input.scheduledEndAt || null,
      p_title: input.title || null,
    });
    if (error) throw error;
    refresh();
  };

  const startStockTask = async (taskId: string) => {
    const { data, error } = await supabase.rpc('start_stock_task', { p_task_id: taskId });
    if (error) throw error;
    if (data) setTasks((current) => current.map((task) => task.id === taskId ? mapTask(data) : task));
  };

  const submitStockTask = async (taskId: string, items: SubmitStockTaskCommand['items']) => {
    const { error } = await supabase.rpc('submit_stock_task', {
      p_task_id: taskId,
      p_items: items.map((item) => ({ task_item_id: item.taskItemId, counted_quantity: item.countedQuantity, observed_expiry_date: item.observedExpiryDate, note: item.note })),
    });
    if (error) throw error;
    refresh();
  };

  const reviewStockTask = async (taskId: string, approve: boolean, note?: string) => {
    const command: ReviewStockTaskCommand = { taskId, approve, note: note || null };
    const { error } = await supabase.rpc('review_stock_task', { p_task_id: command.taskId, p_approve: command.approve, p_note: command.note });
    if (error) throw error;
    refresh();
  };

  const punchAttendance = async (input: { locationId: string; method?: PunchMethod; qrToken?: string; notes?: string }): Promise<AttendanceShift> => {
    const { data, error } = await supabase.rpc('punch_attendance', {
      p_location_id: input.locationId,
      p_method: input.method || 'qr_scan',
      p_qr_token: input.qrToken || null,
      p_notes: input.notes || null,
    });
    if (error) throw error;
    refresh();
    return mapAttendanceShift(data);
  };

  const submitLeaveRequest = async (input: { leaveType: LeaveType; startDate: string; endDate: string; daysCount: number; managerUserId: string; reason?: string }) => {
    const { error } = await supabase.rpc('submit_leave_request', {
      p_leave_type: input.leaveType,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_days_count: input.daysCount,
      p_manager_user_id: input.managerUserId,
      p_reason: input.reason || null,
    });
    if (error) throw error;
    refresh();
  };

  const reviewLeaveRequest = async (requestId: string, approve: boolean, note?: string) => {
    const { error } = await supabase.rpc('review_leave_request', {
      p_request_id: requestId,
      p_approve: approve,
      p_manager_note: note || null,
    });
    if (error) throw error;
    refresh();
  };

  const contextValue: PlatformContextValue = {
    loading,
    unauthorizedTenant,
    userEmail,
    userName,
    userTitle,
    userAvatarUrl,
    userRole,
    companyUserId,
    companyId,
    company,
    locations,
    visibleLocations,
    selectedLocationId,
    setSelectedLocationId,
    locationScope,
    locationName,
    products,
    lots,
    scopedLots,
    suppliers,
    supplierContacts,
    supplierProducts,
    requests,
    transfers,
    counts,
    movements,
    teamMembers,
    teamAssignments,
    tasks,
    taskItems,
    taskExpected,
    activityLogs,
    metrics,
    notificationItems,
    globalSearchQuery,
    setGlobalSearchQuery,
    taskScanQuery,
    setTaskScanQuery,
    transferProductId,
    setTransferProductId,
    supplierProductId,
    setSupplierProductId,
    activeTab,
    tenantPrefix,
    supplierTab,
    setSupplierTab,
    taskTab,
    setTaskTab,
    attendanceTab,
    setAttendanceTab,
    userPermissions,
    canManage: adminRoles.includes(userRole) || Boolean(userPermissions?.capabilities?.can_manage_team),
    canManageTasks: adminRoles.includes(userRole) || userRole === 'manager' || Boolean(userPermissions?.capabilities?.can_manage_attendance),
    canEditStock: adminRoles.includes(userRole) || Boolean(userPermissions?.capabilities?.can_edit_stock),
    canApproveTransfers: adminRoles.includes(userRole) || userRole === 'manager' || Boolean(userPermissions?.capabilities?.can_approve_transfers),
    canManageAttendance: adminRoles.includes(userRole) || userRole === 'manager' || Boolean(userPermissions?.capabilities?.can_manage_attendance),
    canManageTeam: adminRoles.includes(userRole) || Boolean(userPermissions?.capabilities?.can_manage_team),
    navigateToTab,
    refresh,
    notificationsOpen,
    setNotificationsOpen,
    openNotifications,
    closeNotifications,
    scannerOpen,
    setScannerOpen,
    openScanner,
    closeScanner,
    receiveOpen,
    setReceiveOpen,
    receiveProductId,
    receiveProductSearch,
    openReceive,
    productEditOpen,
    setProductEditOpen,
    editingProduct,
    openProductEdit,
    closeProductEdit,
    updateProduct,
    deleteProduct,
    resolveExpiry,
    updateLotDetails,
    updateLotRecord,
    deleteLot,
    createSupplierRequest,
    createSupplier,
    createSupplierContact,
    updateSupplierContact,
    setPrimarySupplierContact,
    deleteSupplierContact,
    linkSupplierProduct,
    unlinkSupplierProduct,
    exportStock,
    updateSupplierRequest,
    createTransfer,
    approveTransfer,
    receiveTransfer,
    createLocation,
    updateLocation,
    assignLocation,
    unassignLocation,
    inviteMember,
    updateMemberRole,
    updateMemberDetails,
    createStockTask,
    startStockTask,
    submitStockTask,
    reviewStockTask,
    attendanceShifts,
    leaveRequests,
    leaveBalances,
    punchAttendance,
    submitLeaveRequest,
    reviewLeaveRequest,
  };

  return (
    <PlatformContext.Provider value={contextValue}>
      {children}
    </PlatformContext.Provider>
  );
}
