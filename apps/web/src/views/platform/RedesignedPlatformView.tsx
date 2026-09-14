'use client';

import React, { type UIEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { CompanyUserRole, CreateStockTaskCommand, InventoryTransfer, Location, NotificationTask, Product, ReviewStockTaskCommand, StockActivityLog, StockLot, StockMovement, StockTask, StockTaskExpected, StockTaskItem, SubmitStockTaskCommand, Supplier, SupplierContact, SupplierProduct, SupplierRequest } from '@stocky/types';
import {
  BarcodeScannerWidget,
  type NotificationQueueItem,
  MobileBottomNavWidget,
  MobileSubNavWidget,
  NotificationsDrawerWidget,
  PlatformTopBarWidget,
  PlatformWorkspaceWidget,
  ProductEditDrawerWidget,
  ReceiveStockDrawerWidget,
  SidebarNavWidget,
  type SupplierContactInput,
  type StockLotUpdateInput,
} from '@/widgets';

const roleTitles: Record<CompanyUserRole, string> = { owner: 'Owner', admin: 'Administrator', manager: 'Branch Manager', staff: 'Staff Member' };
const adminRoles: CompanyUserRole[] = ['owner', 'admin'];
const staffTabs = ['home', 'stock', 'expiry', 'tasks', 'attendance', 'timesheets', 'notifications', 'settings', 'receive', 'logs', 'locations', 'supplier-requests', 'tasks-completed'];
const managerTabs = ['home', 'stock', 'expiry', 'tasks', 'attendance', 'timesheets', 'notifications', 'settings', 'receive', 'logs', 'suppliers', 'transfers', 'locations', 'supplier-requests', 'tasks-completed'];

function canOpenTab(role: CompanyUserRole, tab: string) {
  if (adminRoles.includes(role)) return true;
  return (role === 'manager' ? managerTabs : staffTabs).includes(tab);
}

function mapLocation(row: any): Location { return { id: row.id, companyId: row.company_id, name: row.name, code: row.code, type: row.type, address: row.address, phone: row.phone, managerUserId: row.manager_user_id, isActive: row.is_active, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapProduct(row: any): Product { return { id: row.id, companyId: row.company_id, name: row.name, barcode: row.barcode, categoryId: row.category_id, categoryName: row.category_name || 'General', unitName: row.unit_name || 'unit', reorderPoint: Number(row.reorder_point || 0), defaultExpiryNotificationDays: row.default_expiry_notification_days == null ? null : Number(row.default_expiry_notification_days), defaultSupplierId: row.default_supplier_id, unitCost: Number(row.unit_cost || 0), isActive: Boolean(row.is_active), createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapLot(row: any): StockLot { return { id: row.id, companyId: row.company_id, productId: row.product_id, locationId: row.location_id, supplierId: row.supplier_id, lotNumber: row.lot_number, receivedAt: row.received_at, manufacturedAt: row.manufactured_at, expiryDate: row.expiry_date, expiryNotificationDays: row.expiry_notification_days == null ? null : Number(row.expiry_notification_days), quantityOnHand: Number(row.quantity_on_hand || 0), unitCost: Number(row.unit_cost || 0), status: row.status, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }
function mapSupplier(row: any): Supplier { return { id: row.id, companyId: row.company_id, name: row.name, address: row.address, contactName: row.contact_name || '', contactPhone: row.contact_phone || '', contactEmail: row.contact_email, itemsSupplied: row.items_supplied || [], itemCount: Number(row.item_count || 0), createdAt: row.created_at, updatedAt: row.updated_at }; }
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

export function RedesignedPlatformView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [supplierTab, setSupplierTab] = useState<'suppliers' | 'requests'>('suppliers');
  const [taskTab, setTaskTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const lastScrollTopRef = useRef(0);
  const chromeVisibilityRef = useRef(true);
  const chromeTransitionTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userTitle, setUserTitle] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<CompanyUserRole>('owner');
  const [companyUserId, setCompanyUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [company, setCompany] = useState<any>(null);
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
  const [tasks, setTasks] = useState<StockTask[]>([]);
  const [taskItems, setTaskItems] = useState<StockTaskItem[]>([]);
  const [taskExpected, setTaskExpected] = useState<StockTaskExpected[]>([]);
  const [activityLogs, setActivityLogs] = useState<StockActivityLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) console.error('Unable to restore the Stocky session', authError);
      const user = auth.user;
      if (!user) { setLoading(false); router.replace('/'); return; }
      setUserEmail(user.email || null);
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || null);
      setUserTitle(user.user_metadata?.job_title || user.user_metadata?.title || 'Team member');
      setUserAvatarUrl(user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
      // Resolve the current membership by auth id first. The old OR query used
      // maybeSingle(), which could fail as soon as the company had more than
      // one matching/legacy membership and made a normal refresh look like a
      // sign-out. Email is only a compatibility fallback for older records.
      const { data: authProfiles, error: authProfileError } = await supabase
        .from('company_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (authProfileError) console.error('Unable to load the signed-in company membership', authProfileError);
      let profile = authProfiles?.[0] ?? null;
      if (!profile && user.email) {
        const { data: emailProfiles, error: emailProfileError } = await supabase
          .from('company_users')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);
        if (emailProfileError) console.error('Unable to load the email-based company membership', emailProfileError);
        profile = emailProfiles?.[0] ?? null;
      }
      if (!profile?.company_id) { setLoading(false); router.replace('/onboarding'); return; }
      if (profile.status && profile.status !== 'active') { setLoading(false); router.replace('/verification-pending'); return; }
      const role = profile.role as CompanyUserRole;
      setCompanyUserId(profile.id); setUserRole(role); setCompanyId(profile.company_id); setUserName(profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || null); setUserTitle(roleTitles[role] || 'Team member'); setUserAvatarUrl(profile.avatar_url || user.user_metadata?.avatar_url || null);
      const { data: comp } = await supabase.from('companies').select('*').eq('id', profile.company_id).maybeSingle();
      if (comp) {
        if (comp.status && comp.status !== 'verified') { router.replace('/verification-pending'); return; }
        let companyLogoUrl = comp.logo_url;
        if (companyLogoUrl && !companyLogoUrl.startsWith('http')) {
          const { data: signedLogo } = await supabase.storage.from('stocky-private').createSignedUrl(companyLogoUrl, 60 * 60);
          companyLogoUrl = signedLogo?.signedUrl || null;
        }
        setCompany({ ...comp, logo_url: companyLogoUrl });
      }
      const { data: syncedNotifications, error: notificationSyncError } = await supabase.rpc('sync_stocky_notifications');
      if (notificationSyncError) console.warn('Notification sync unavailable; using live action queue', notificationSyncError.message);
      setNotificationSyncAvailable(!notificationSyncError);
      const [{ data: dbLocations }, { data: userLocations }, { data: dbProducts }, { data: dbLots }, { data: dbSuppliers }, { data: dbSupplierContacts }, { data: dbSupplierProducts }, { data: dbRequests }, { data: dbTransfers }, { data: dbCounts }, { data: dbCountLines }, { data: dbTeam }, { data: dbMovements }, { data: dbTasks }, { data: dbTaskItems }, { data: dbTaskExpected }, { data: dbActivityLogs }] = await Promise.all([
        supabase.from('locations').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('user_locations').select('location_id').eq('user_id', profile.id),
        supabase.from('products').select('*').eq('company_id', profile.company_id).eq('is_active', true).order('name'),
        supabase.from('stock_lots').select('*').eq('company_id', profile.company_id).order('expiry_date', { ascending: true, nullsFirst: false }),
        // Load the source table directly. Supplier creation writes to `suppliers`,
        // and relying on the optional summary view here could make a successful
        // insert disappear again when the view is unavailable in a local schema.
        supabase.from('suppliers').select('*').eq('company_id', profile.company_id).order('name'),
        supabase.from('supplier_contacts').select('*').eq('company_id', profile.company_id).order('is_primary', { ascending: false }).order('name'),
        supabase.from('supplier_products').select('*').eq('company_id', profile.company_id),
        supabase.from('supplier_requests').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_transfers').select('*').eq('company_id', profile.company_id).order('requested_at', { ascending: false }),
        supabase.from('stock_count_sessions').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_count_lines').select('*').order('created_at', { ascending: true }),
        supabase.from('company_users').select('id,email,full_name,avatar_url,role,status').eq('company_id', profile.company_id).order('full_name'),
        supabase.from('stock_movements').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(300),
        supabase.from('stock_tasks').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }),
        supabase.from('stock_task_items').select('id,task_id,product_id,stock_lot_id,counted_quantity,observed_expiry_date,note,status,completed_at,created_at,updated_at').eq('company_id', profile.company_id).order('created_at', { ascending: true }),
        supabase.from('stock_task_expected').select('*'),
        supabase.from('stock_activity_logs').select('*').eq('company_id', profile.company_id).order('created_at', { ascending: false }).limit(500),
      ]);
      if (cancelled) return;
      const { data: dbAssignments } = await supabase.from('user_locations').select('id,user_id,location_id');
      const nextLocations = (dbLocations || []).map(mapLocation);
      const nextAssigned = Array.from(new Set([...(userLocations || []).map((row: any) => row.location_id), ...nextLocations.filter((location) => location.managerUserId === profile.id).map((location) => location.id)]));
      const countLinesBySession = new Map<string, any[]>();
      (dbCountLines || []).forEach((line: any) => { const current = countLinesBySession.get(line.session_id) || []; current.push(line); countLinesBySession.set(line.session_id, current); });
      setAssignedLocationIds(nextAssigned); setLocations(nextLocations); setProducts((dbProducts || []).map(mapProduct)); setLots((dbLots || []).map(mapLot)); setSuppliers((dbSuppliers || []).map(mapSupplier)); setSupplierContacts((dbSupplierContacts || []).map(mapSupplierContact)); setSupplierProducts((dbSupplierProducts || []).map(mapSupplierProduct)); setRequests((dbRequests || []).map(mapRequest)); setTransfers((dbTransfers || []).map(mapTransfer)); setCounts((dbCounts || []).map((count: any) => ({ ...count, lines: countLinesBySession.get(count.id) || [] }))); setTeamMembers(dbTeam || []); setTeamAssignments(dbAssignments || []); setMovements((dbMovements || []).map(mapMovement)); setTasks((dbTasks || []).map(mapTask)); setTaskItems((dbTaskItems || []).map(mapTaskItem)); setTaskExpected((dbTaskExpected || []).map(mapTaskExpected)); setActivityLogs((dbActivityLogs || []).map(mapActivityLog)); setPersistedNotifications((syncedNotifications || []).map(mapNotification));
      const visible = adminRoles.includes(role) ? nextLocations : nextLocations.filter((location) => nextAssigned.includes(location.id));
      if (!adminRoles.includes(role) && visible.length > 0) setSelectedLocationId((current) => visible.some((location) => location.id === current) ? current : visible[0].id);
      if (adminRoles.includes(role)) setSelectedLocationId((current) => current || 'all');
      setLoading(false);
    }
    load().catch((error) => { console.error('Failed to load redesigned platform', error); setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey, router]);

  const visibleLocations = useMemo(() => adminRoles.includes(userRole) ? locations : locations.filter((location) => assignedLocationIds.includes(location.id)), [assignedLocationIds, locations, userRole]);
  const locationScope = selectedLocationId === 'all' && adminRoles.includes(userRole) ? 'all' : (selectedLocationId === 'all' ? visibleLocations[0]?.id || '' : selectedLocationId);
  const scopedLots = useMemo(() => lots.filter((lot) => locationScope === 'all' || lot.locationId === locationScope), [locationScope, lots]);
  const locationName = locationScope === 'all' ? 'All locations' : visibleLocations.find((location) => location.id === locationScope)?.name || 'Your location';
  const metrics = useMemo(() => { const today = Date.now(); const expiry = scopedLots.filter((lot) => lot.quantityOnHand > 0 && lot.expiryDate).map((lot) => ({ lot, days: Math.ceil((new Date(lot.expiryDate as string).getTime() - today) / 86400000) })); const productTotals = new Map<string, number>(); scopedLots.forEach((lot) => productTotals.set(lot.productId, (productTotals.get(lot.productId) || 0) + lot.quantityOnHand)); return { expiredLots: expiry.filter(({ days }) => days < 0).length, expiringLots: expiry.filter(({ lot, days }) => days >= 0 && days <= (lot.expiryNotificationDays ?? 0)).length, lowStockProducts: products.filter((product) => (productTotals.get(product.id) || 0) <= product.reorderPoint).length, pendingTransfers: transfers.filter((transfer) => ['requested', 'approved', 'in_transit', 'partially_received'].includes(transfer.status)).length, supplierRequests: requests.filter((request) => !['closed', 'cancelled'].includes(request.status)).length, openCounts: tasks.filter((task) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status)).length }; }, [products, requests, scopedLots, tasks, transfers]);
  const liveNotificationItems = useMemo<NotificationQueueItem[]>(() => {
    const today = Date.now();
    const productMap = new Map(products.map((product) => [product.id, product]));
    const locationMap = new Map(visibleLocations.map((location) => [location.id, location]));
    const items: NotificationQueueItem[] = [];
    scopedLots.filter((lot) => lot.quantityOnHand > 0 && lot.expiryDate).map((lot) => ({ lot, days: Math.ceil((new Date(lot.expiryDate as string).getTime() - today) / 86400000) })).filter(({ lot, days }) => days < 0 || days <= (lot.expiryNotificationDays ?? 0)).slice(0, 8).forEach(({ lot, days }) => {
      const product = productMap.get(lot.productId);
      items.push({ id: `expiry-${lot.id}`, title: days < 0 ? `${product?.name || 'Product'} is expired` : `${product?.name || 'Product'} is expiring soon`, message: `${lot.quantityOnHand} units at ${locationMap.get(lot.locationId)?.name || 'your location'} · batch ${lot.lotNumber || 'not recorded'}`, actionLabel: 'Review', severity: days < 0 ? 'critical' : 'warning', onOpen: () => setActiveTab('expiry') });
    });
    products.filter((product) => scopedLots.filter((lot) => lot.productId === product.id).reduce((sum, lot) => sum + lot.quantityOnHand, 0) <= product.reorderPoint).slice(0, 5).forEach((product) => items.push({ id: `low-${product.id}`, title: `${product.name} is low`, message: `At or below the reorder point of ${product.reorderPoint} ${product.unitName}`, actionLabel: 'Open stock', severity: 'warning', onOpen: () => setActiveTab('stock') }));
      if (canOpenTab(userRole, 'transfers')) transfers.filter((transfer) => ['requested', 'approved', 'in_transit', 'partially_received'].includes(transfer.status)).slice(0, 5).forEach((transfer) => items.push({ id: `transfer-${transfer.id}`, title: 'Transfer needs attention', message: `${transfer.status.replace('_', ' ')} · ${transfer.id.slice(0, 8)}`, actionLabel: 'Open transfers', severity: 'info', onOpen: () => setActiveTab('transfers') }));
      if (canOpenTab(userRole, 'suppliers')) requests.filter((request) => !['closed', 'cancelled'].includes(request.status)).slice(0, 5).forEach((request) => items.push({ id: `supplier-${request.id}`, title: 'Supplier follow-up needed', message: `${request.requestType} request · ${request.status}`, actionLabel: 'Open suppliers', severity: 'info', onOpen: () => setActiveTab('suppliers') }));
      if (canOpenTab(userRole, 'tasks')) tasks.filter((task) => ['assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status)).slice(0, 5).forEach((task) => items.push({ id: `task-${task.id}`, title: task.taskType === 'count' ? 'Stock count task needs attention' : 'Expiry audit task needs attention', message: `${task.status.replace('_', ' ')} · ${locationMap.get(task.locationId)?.name || 'Location'}`, actionLabel: 'Open tasks', severity: 'info', onOpen: () => setActiveTab('tasks') }));
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
    return persistedNotifications.filter((notification) => canOpenTab(userRole, targetTab[notification.notificationType])).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message || 'This item needs attention.',
      actionLabel: actionLabel[notification.notificationType],
      severity: notification.severity,
      onOpen: () => {
        void supabase.rpc('mark_stocky_notification_read', { p_notification_id: notification.id });
        const nextTab = targetTab[notification.notificationType];
        if (canOpenTab(userRole, nextTab)) setActiveTab(nextTab);
      },
    }));
  }, [liveNotificationItems, notificationSyncAvailable, persistedNotifications, userRole]);

  const refresh = () => setReloadKey((value) => value + 1);
  const openReceive = (productId?: string, productSearch?: string) => { setReceiveProductId(productId); setReceiveProductSearch(productSearch); setReceiveOpen(true); };
  const openProductEdit = (product: Product) => { setEditingProduct(product); setProductEditOpen(true); };
  const updateProduct = async (product: Product, input: { name: string; barcode: string; categoryName: string; unitName: string; reorderPoint: number; defaultExpiryNotificationDays: number | null; defaultSupplierId: string | null; unitCost: number }) => {
    const { data, error } = await supabase.from('products').update({
      name: input.name,
      barcode: input.barcode || null,
      category_name: input.categoryName,
      unit_name: input.unitName,
      reorder_point: input.reorderPoint,
      default_expiry_notification_days: input.defaultExpiryNotificationDays,
      default_supplier_id: input.defaultSupplierId,
      unit_cost: input.unitCost,
      updated_at: new Date().toISOString(),
    }).eq('id', product.id).eq('company_id', companyId).select('*').single();
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
  const resolveExpiry = async (lot: StockLot, action: 'hold' | 'dispose' | 'return' | 'replace', reason?: string) => { const { error } = await supabase.rpc('resolve_expiry_action', { p_lot_id: lot.id, p_action: action, p_reason: reason || 'Resolved from the expiry queue' }); if (error) alert(error.message); else refresh(); };
  const updateLotDetails = async (lot: StockLot, input: { lotNumber?: string; expiryDate: string; notificationDays: number }) => { const { error } = await supabase.rpc('update_stock_lot_details', { p_lot_id: lot.id, p_lot_number: input.lotNumber || null, p_expiry_date: input.expiryDate, p_expiry_notification_days: input.notificationDays }); if (error) alert(error.message); else refresh(); };
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
  const createSupplierRequest = async (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => { const { error } = await supabase.rpc('create_supplier_request', { p_location_id: input.locationId, p_product_id: input.productId, p_request_type: input.requestType, p_quantity: input.quantity || null, p_supplier_id: input.supplierId || null, p_reason: 'Created from Stocky' }); if (error) alert(error.message); else refresh(); };
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
    if (contactError) console.warn('Supplier saved without a contact record; apply the supplier contacts migration to enable contact history.', contactError.message);
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
  const linkSupplierProduct = async (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => { const { error } = await supabase.from('supplier_products').upsert({ company_id: companyId, supplier_id: input.supplierId, product_id: input.productId, supplier_sku: input.supplierSku || null, unit_cost: input.unitCost ?? null, updated_at: new Date().toISOString() }, { onConflict: 'company_id,supplier_id,product_id' }); if (error) throw error; refresh(); };
  const unlinkSupplierProduct = async (supplierProductId: string) => { const { error } = await supabase.from('supplier_products').delete().eq('id', supplierProductId); if (error) throw error; refresh(); };
  const exportStock = () => { const productMap = new Map(products.map((product) => [product.id, product])); const locationMap = new Map(visibleLocations.map((location) => [location.id, location])); const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`; const header = ['Product', 'Barcode', 'Category', 'Location', 'Batch / lot', 'Quantity', 'Unit', 'Expiry date', 'Notify before (days)', 'Unit cost', 'Status']; const rows = lots.filter((lot) => locationScope === 'all' || lot.locationId === locationScope).map((lot) => { const product = productMap.get(lot.productId); return [product?.name, product?.barcode, product?.categoryName, locationMap.get(lot.locationId)?.name, lot.lotNumber, lot.quantityOnHand, product?.unitName, lot.expiryDate, lot.expiryNotificationDays, lot.unitCost, lot.status].map(escape).join(','); }); const blob = new Blob([[header.map(escape).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `stocky-stock-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url); };
  const updateSupplierRequest = async (request: SupplierRequest, status: SupplierRequest['status']) => { const { error } = await supabase.rpc('update_supplier_request_status', { p_request_id: request.id, p_status: status }); if (error) alert(error.message); else refresh(); };
  const createTransfer = async (input: { sourceLocationId: string; destinationLocationId: string; lines: Array<{ productId: string; quantity: number }>; note?: string }) => { const { error } = await supabase.rpc('create_stock_transfer_multi', { p_source_location_id: input.sourceLocationId, p_destination_location_id: input.destinationLocationId, p_lines: input.lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })), p_note: input.note || null }); if (error) alert(error.message); else refresh(); };
  const approveTransfer = async (transfer: InventoryTransfer) => { const { error } = await supabase.rpc('approve_stock_transfer', { p_transfer_id: transfer.id, p_approve: true, p_note: null }); if (error) alert(error.message); else refresh(); };
  const receiveTransfer = async (transfer: InventoryTransfer, lines?: Array<{ lineId: string; quantityReceived: number }>, note?: string) => { const { error } = lines ? await supabase.rpc('receive_stock_transfer_partial', { p_transfer_id: transfer.id, p_lines: lines.map((line) => ({ line_id: line.lineId, quantity_received: line.quantityReceived })), p_note: note || null }) : await supabase.rpc('receive_stock_transfer', { p_transfer_id: transfer.id }); if (error) alert(error.message); else refresh(); };
  const createLocation = async (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => { const payload: any = { company_id: companyId, name: input.name, type: input.type, address: input.address || null, phone: input.phone || null, manager_user_id: input.managerUserId || null, is_active: true }; if (input.imageUrl !== undefined) payload.image_url = input.imageUrl || null; const { data: created, error } = await supabase.from('locations').insert(payload).select('id').single(); if (error || !created) { if (error) alert(error.message); return; } if (input.managerUserId) { const { error: assignmentError } = await supabase.from('user_locations').upsert({ user_id: input.managerUserId, location_id: created.id }, { onConflict: 'user_id,location_id' }); if (assignmentError) alert(assignmentError.message); } refresh(); };
  const updateLocation = async (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => { const patch: any = { updated_at: new Date().toISOString() }; if (input.name !== undefined) patch.name = input.name; if (input.type !== undefined) patch.type = input.type; if (input.address !== undefined) patch.address = input.address || null; if (input.phone !== undefined) patch.phone = input.phone || null; if (input.managerUserId !== undefined) patch.manager_user_id = input.managerUserId || null; if (input.imageUrl !== undefined) patch.image_url = input.imageUrl || null; const { error } = await supabase.from('locations').update(patch).eq('id', locationId).eq('company_id', companyId); if (error) { alert(error.message); return; } if (input.managerUserId) { await supabase.from('user_locations').upsert({ user_id: input.managerUserId, location_id: locationId }, { onConflict: 'user_id,location_id' }); } refresh(); };
  const assignLocation = async (userId: string, locationId: string) => { const { error } = await supabase.from('user_locations').insert({ user_id: userId, location_id: locationId }); if (error) alert(error.message); else refresh(); };
  const unassignLocation = async (assignmentId: string) => { const { error } = await supabase.from('user_locations').delete().eq('id', assignmentId); if (error) alert(error.message); else refresh(); };
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
        // Do not leave a half-created invitation behind when its first
        // location assignment fails.
        await supabase.from('company_users').delete().eq('id', data.id).eq('company_id', companyId);
        throw assignmentError;
      }
      createdAssignment = assignment;
    }
    // Keep the current workspace mounted. Re-running the whole platform load
    // here made the invite action vulnerable to a transient auth lookup and
    // sent the owner back to the landing page. The server record is already
    // committed, so update only the team slices that changed.
    setTeamMembers((current) => [...current, {
      id: data.id,
      email,
      full_name: input.fullName || null,
      role: input.role,
      status: 'invited',
    }]);
    if (createdAssignment) setTeamAssignments((current) => [...current, createdAssignment as { id: string; user_id: string; location_id: string }]);
  };
  const updateMemberRole = async (memberId: string, role: CompanyUserRole) => { const { error } = await supabase.from('company_users').update({ role, updated_at: new Date().toISOString() }).eq('id', memberId); if (error) alert(error.message); else refresh(); };

  const createStockTask = async (input: CreateStockTaskCommand) => {
    const { error } = await supabase.rpc('create_stock_task', {
      p_location_id: input.locationId,
      p_task_type: input.taskType,
      p_assigned_to_company_user_id: input.assignedToCompanyUserId,
      p_product_ids: input.productIds,
      p_note: input.note || null,
      p_scheduled_start_at: input.scheduledStartAt || null,
      p_scheduled_end_at: input.scheduledEndAt || null,
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
  const handleMainScroll = (event: UIEvent<HTMLElement>) => {
    const scroller = event.currentTarget;
    const nextScrollTop = scroller.scrollTop;
    if (chromeTransitionTimerRef.current !== null) {
      lastScrollTopRef.current = nextScrollTop;
      return;
    }
    const previousScrollTop = lastScrollTopRef.current;
    if (nextScrollTop <= 8 || nextScrollTop < previousScrollTop - 6) {
      if (!chromeVisibilityRef.current) {
        chromeVisibilityRef.current = true;
        setIsChromeVisible(true);
        chromeTransitionTimerRef.current = window.setTimeout(() => {
          chromeTransitionTimerRef.current = null;
          lastScrollTopRef.current = scroller.scrollTop;
        }, 240);
      }
    } else if (nextScrollTop > previousScrollTop + 6) {
      if (chromeVisibilityRef.current) {
        chromeVisibilityRef.current = false;
        setIsChromeVisible(false);
        chromeTransitionTimerRef.current = window.setTimeout(() => {
          chromeTransitionTimerRef.current = null;
          lastScrollTopRef.current = scroller.scrollTop;
        }, 240);
      }
    }
    lastScrollTopRef.current = nextScrollTop;
  };
  const handleNavigationChange = (tab: string) => {
    chromeVisibilityRef.current = true;
    setIsChromeVisible(true);
    lastScrollTopRef.current = 0;
    if (tab === 'supplier-requests') {
      setSupplierTab('requests');
      setActiveTab('suppliers');
      return;
    }
    if (tab === 'suppliers') {
      setSupplierTab('suppliers');
    }
    if (tab === 'tasks-completed') {
      setTaskTab('completed');
      setActiveTab('tasks');
      return;
    }
    if (tab === 'tasks') {
      setTaskTab('ongoing');
    }
    if (!canOpenTab(userRole, tab)) return;
    setActiveTab(tab);
  };
  useEffect(() => {
    chromeVisibilityRef.current = true;
    setIsChromeVisible(true);
    lastScrollTopRef.current = 0;
  }, [activeTab]);
  useEffect(() => () => {
    if (chromeTransitionTimerRef.current !== null) window.clearTimeout(chromeTransitionTimerRef.current);
  }, []);

  return (
    <>
      <PlatformTopBarWidget
        userEmail={userEmail}
        userName={userName}
        userTitle={userTitle}
        userAvatarUrl={userAvatarUrl}
        companyName={company?.name}
        companyLogoUrl={company?.logo_url}
        searchValue={globalSearchQuery}
        hidden={!isChromeVisible}
        onSearch={(query) => { setGlobalSearchQuery(query); if (query.trim()) setActiveTab('stock'); }}
        onSettingsClick={() => handleNavigationChange('settings')}
        onNotificationsClick={() => setNotificationsOpen(true)}
        isNotificationsOpen={notificationsOpen}
        notificationCount={notificationItems.length}
        activeTab={activeTab}
      />
      <MobileSubNavWidget
        activeTab={activeTab}
        userRole={userRole}
        hidden={!isChromeVisible}
        onTabChange={handleNavigationChange}
        supplierTab={supplierTab}
        onSupplierTabChange={setSupplierTab}
        taskTab={taskTab}
        onTaskTabChange={setTaskTab}
      />
      <div className="stocky-platform-body flex flex-1 min-h-0 min-w-0">
        <SidebarNavWidget activeTab={activeTab} onTabChange={handleNavigationChange} userRole={userRole} companyName={company?.name} companyLogoUrl={company?.logo_url} notificationCount={notificationItems.length} onNotificationsClick={() => setNotificationsOpen(true)} searchQuery={globalSearchQuery} onSearch={(query) => { setGlobalSearchQuery(query); if (query.trim()) setActiveTab('stock'); }} userEmail={userEmail} userName={userName} userTitle={userTitle} userAvatarUrl={userAvatarUrl} onSettingsClick={() => handleNavigationChange('settings')} />
        <PlatformWorkspaceWidget
          activeTab={activeTab}
          loading={loading}
          userName={userName}
          companyId={companyId}
          companyName={company?.name}
          userRole={userRole}
          supplierTab={supplierTab}
          onSupplierTabChange={setSupplierTab}
          taskTab={taskTab}
          onTaskTabChange={setTaskTab}
          locationName={locationName}
          metrics={metrics}
          notificationItems={notificationItems}
          products={products}
          lots={lots}
          locations={visibleLocations}
          suppliers={suppliers}
          supplierContacts={supplierContacts}
          supplierProducts={supplierProducts}
          requests={requests}
          transfers={transfers}
          counts={counts}
          teamMembers={teamMembers}
          teamAssignments={teamAssignments}
          activityLogs={activityLogs}
          tasks={tasks}
          taskItems={taskItems}
          taskExpected={taskExpected}
          currentUserId={companyUserId}
          selectedLocationId={locationScope}
          searchQuery={globalSearchQuery}
          taskScanQuery={taskScanQuery}
          defaultTransferProductId={transferProductId}
          defaultSupplierProductId={supplierProductId}
          canManage={adminRoles.includes(userRole)}
          canManageTasks={adminRoles.includes(userRole) || userRole === 'manager'}
          onTabChange={handleNavigationChange}
          onScroll={handleMainScroll}
          onOpenReceive={(productId) => openReceive(productId)}
          onOpenCount={() => handleNavigationChange('stock')}
          onEditProduct={adminRoles.includes(userRole) ? openProductEdit : undefined}
          onDeleteProduct={adminRoles.includes(userRole) ? deleteProduct : undefined}
          onSaveLot={userRole !== 'staff' ? updateLotRecord : undefined}
          onDeleteLot={userRole !== 'staff' ? deleteLot : undefined}
          onProductTransfer={(productId) => { setTransferProductId(productId); handleNavigationChange('transfers'); }}
          onProductSupplierRequest={(productId) => { setSupplierProductId(productId); handleNavigationChange('suppliers'); }}
          onLocationChange={setSelectedLocationId}
          onCreateLocation={createLocation}
          onUpdateLocation={updateLocation}
          onCreateSupplierRequest={createSupplierRequest}
          onCreateSupplier={createSupplier}
          onCreateSupplierContact={createSupplierContact}
          onUpdateSupplierContact={updateSupplierContact}
          onDeleteSupplierContact={deleteSupplierContact}
          onSetPrimarySupplierContact={setPrimarySupplierContact}
          onUpdateSupplierRequest={updateSupplierRequest}
          onLinkSupplierProduct={linkSupplierProduct}
          onUnlinkSupplierProduct={unlinkSupplierProduct}
          onResolveExpiry={resolveExpiry}
          onSupplierExpiryRequest={(input) => createSupplierRequest({ productId: input.productId, locationId: input.locationId, quantity: input.quantity, supplierId: input.supplierId, requestType: input.type })}
          onTransferExpiryRequest={(productId, locationId) => { setSelectedLocationId(locationId); setTransferProductId(productId); handleNavigationChange('transfers'); }}
          onUpdateLot={updateLotDetails}
          onCreateTransfer={createTransfer}
          onApproveTransfer={approveTransfer}
          onReceiveTransfer={receiveTransfer}
          onCreateTask={createStockTask}
          onStartTask={startStockTask}
          onSubmitTask={submitStockTask}
          onReviewTask={reviewStockTask}
          onInvite={inviteMember}
          onRoleChange={updateMemberRole}
          onAssignLocation={assignLocation}
          onUnassignLocation={unassignLocation}
          onExport={adminRoles.includes(userRole) ? exportStock : undefined}
          onImportSuccess={refresh}
        />
      </div>
      <NotificationsDrawerWidget
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notificationItems}
        onNavigateToLogs={() => handleNavigationChange('logs')}
      />
      <ReceiveStockDrawerWidget isOpen={receiveOpen} onClose={() => setReceiveOpen(false)} products={products} locations={visibleLocations} suppliers={suppliers} companyId={companyId} userRole={userRole} defaultProductId={receiveProductId} defaultProductSearch={receiveProductSearch} defaultLocationId={locationScope === 'all' ? visibleLocations[0]?.id : locationScope} onSaved={refresh} />
      <ProductEditDrawerWidget isOpen={productEditOpen} product={editingProduct} categories={Array.from(new Set(products.map((product) => product.categoryName).filter(Boolean)))} suppliers={suppliers} onClose={() => { setProductEditOpen(false); setEditingProduct(null); }} onSave={updateProduct} />
      <BarcodeScannerWidget onProductFound={() => undefined} onBarcodeFound={(barcode) => { setGlobalSearchQuery(barcode); setTaskScanQuery(barcode); setActiveTab('stock'); }} onCodeNotFound={(barcode) => { openReceive(undefined, barcode); }} />
      <MobileBottomNavWidget
        activeTab={activeTab}
        userRole={userRole}
        hidden={!isChromeVisible}
        onTabChange={handleNavigationChange}
        userAvatarUrl={userAvatarUrl}
        userName={userName}
        notificationCount={notificationItems.length}
        onPostClick={() => openReceive()}
      />
    </>
  );
}
