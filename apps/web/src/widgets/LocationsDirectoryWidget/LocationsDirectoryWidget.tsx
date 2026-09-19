'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  BoxesIcon,
  BoxIcon,
  CameraIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CloudDownloadIcon,
  EditIcon,
  FilterIcon,
  PlusIcon,
  QrCodeIcon,
  SearchIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { AttendanceShift, InventoryTransfer, Location, Product, StockLot } from '@stocky/types';
import { SideDrawer, BottomSheet } from '@/components/ui';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
import { supabase } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n';

export interface LocationMember {
  id: string;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string;
  status?: string;
}

export interface LocationAssignment {
  id: string;
  user_id: string;
  location_id: string;
}

export interface LocationsDirectoryWidgetProps {
  locations: Location[];
  products: Product[];
  lots: StockLot[];
  transfers?: InventoryTransfer[];
  counts?: Array<{ location_id?: string; status?: string; reviewed_at?: string | null; updated_at?: string | null }>;
  shifts?: AttendanceShift[];
  onOpenStock: (locationId: string) => void;
  canManage?: boolean;
  companyId?: string;
  isFormOpen?: boolean;
  onToggleForm?: () => void;
  members?: LocationMember[];
  assignments?: LocationAssignment[];
  onCreate?: (input: { name: string; type: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string; imageUrl?: string }) => void | Promise<void>;
  onUpdate?: (locationId: string, input: { name?: string; type?: 'branch' | 'warehouse'; address?: string; phone?: string; managerUserId?: string | null; imageUrl?: string | null }) => void | Promise<void>;
  onAssignLocation?: (userId: string, locationId: string) => Promise<void>;
  onUnassignLocation?: (assignmentId: string) => Promise<void>;
}

export function LocationsDirectoryWidget({
  locations,
  products,
  lots,
  transfers = [],
  counts = [],
  shifts = [],
  onOpenStock,
  canManage = false,
  companyId,
  isFormOpen,
  onToggleForm,
  members = [],
  assignments = [],
  onCreate,
  onUpdate,
  onAssignLocation,
  onUnassignLocation,
}: LocationsDirectoryWidgetProps) {
  const { t } = useTranslation();
  // Members fallback loading if not passed from platform context
  const [loadedMembers, setLoadedMembers] = useState<LocationMember[]>([]);
  const [loadedAssignments, setLoadedAssignments] = useState<LocationAssignment[]>([]);

  useEffect(() => {
    if (members.length > 0) return;
    supabase
      .from('company_users')
      .select('id,full_name,email,avatar_url,role,status')
      .then(({ data }) => setLoadedMembers((data as LocationMember[]) || []));
  }, [members.length]);

  useEffect(() => {
    if (assignments.length > 0) return;
    supabase
      .from('user_locations')
      .select('id,user_id,location_id')
      .then(({ data }) => setLoadedAssignments((data as LocationAssignment[]) || []));
  }, [assignments.length]);

  const availableMembers = members.length > 0 ? members : loadedMembers;
  const availableAssignments = assignments.length > 0 ? assignments : loadedAssignments;

  // Search & Floating Filter Panel state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const [selectedColumns, setSelectedColumns] = useState({
    name: true,
    address: true,
    manager: true,
    phone: true,
  });

  const [filterType, setFilterType] = useState<'all' | 'branch' | 'warehouse'>('all');
  const [filterManagerStatus, setFilterManagerStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [filterStaffing, setFilterStaffing] = useState<'all' | 'has_staff' | 'no_staff'>('all');
  const [filterHealth, setFilterHealth] = useState<'all' | 'expiring' | 'low_stock' | 'healthy'>('all');
  const [quickTypeFilter, setQuickTypeFilter] = useState<'all' | 'branch' | 'warehouse'>('all');

  // Drawer state for Create / Edit
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [qrLocation, setQrLocation] = useState<Location | null>(null);
  const [drawerName, setDrawerName] = useState('');
  const [drawerType, setDrawerType] = useState<'branch' | 'warehouse'>('branch');
  const [drawerAddress, setDrawerAddress] = useState('');
  const [drawerPhone, setDrawerPhone] = useState('');
  const [drawerManagerUserId, setDrawerManagerUserId] = useState('');
  const [drawerImageUrl, setDrawerImageUrl] = useState('');
  const [drawerAssignedUserIds, setDrawerAssignedUserIds] = useState<string[]>([]);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError(t('locations.invalidImageFormat'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(t('locations.imageTooLarge'));
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      let targetCompanyId = companyId || locations[0]?.companyId || '';
      if (!targetCompanyId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('company_users')
            .select('company_id')
            .or(`auth_user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
            .maybeSingle();
          if (profile?.company_id) {
            targetCompanyId = profile.company_id;
          }
        }
      }

      if (!targetCompanyId) {
        throw new Error('Unable to identify your company directory in private storage.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const cleanBase = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
      const fileName = `${Date.now()}-${cleanBase || 'branch'}.${fileExt}`;
      const storagePath = `${targetCompanyId}/locations/${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from('stocky-private')
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) {
        throw uploadErr;
      }

      // Generate long-lived signed URL for immediate browser rendering
      const { data: signedData, error: signErr } = await supabase.storage
        .from('stocky-private')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signErr || !signedData?.signedUrl) {
        setDrawerImageUrl(storagePath);
      } else {
        setDrawerImageUrl(signedData.signedUrl);
      }
    } catch (err: any) {
      console.error('Failed to upload location image:', err);
      setUploadError(err?.message || t('locations.uploadFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  // Sync external isFormOpen prop with drawer
  useEffect(() => {
    if (isFormOpen && !drawerOpen && !editingLocation) {
      openCreateDrawer();
    }
  }, [isFormOpen]);

  // Click outside to close filter panel
  useEffect(() => {
    if (!isFilterPanelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterPanelOpen]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterType !== 'all') count += 1;
    if (filterManagerStatus !== 'all') count += 1;
    if (filterStaffing !== 'all') count += 1;
    if (filterHealth !== 'all') count += 1;
    if (!selectedColumns.name || !selectedColumns.address || !selectedColumns.manager || !selectedColumns.phone) count += 1;
    return count;
  }, [filterType, filterManagerStatus, filterStaffing, filterHealth, selectedColumns]);

  const resetFilters = () => {
    setSelectedColumns({ name: true, address: true, manager: true, phone: true });
    setFilterType('all');
    setFilterManagerStatus('all');
    setFilterStaffing('all');
    setFilterHealth('all');
    setQuickTypeFilter('all');
  };

  // Precompute stats, manager, and staff members for each location
  const allLocationStats = useMemo(() => {
    return locations.map((location) => {
      const locationLots = lots.filter((lot) => lot.locationId === location.id && lot.quantityOnHand > 0);
      const productMap = new Map(products.map((product) => [product.id, product]));

      const expiring = locationLots.filter((lot) => {
        if (!lot.expiryDate) return true;
        const days = Math.ceil((new Date(lot.expiryDate).getTime() - Date.now()) / 86400000);
        return days <= (lot.expiryNotificationDays ?? 0);
      }).length;

      const lowStock = products.filter((product) => {
        const quantity = locationLots.filter((lot) => lot.productId === product.id).reduce((sum, lot) => sum + lot.quantityOnHand, 0);
        return quantity <= product.reorderPoint;
      }).length;

      const value = locationLots.reduce((sum, lot) => sum + lot.quantityOnHand * lot.unitCost, 0);
      const pendingTransfers = transfers.filter(
        (transfer) =>
          ['requested', 'approved', 'in_transit', 'partially_received'].includes(transfer.status) &&
          (transfer.sourceLocationId === location.id || transfer.destinationLocationId === location.id)
      ).length;

      const lastCompletedCount = counts
        .filter((count) => count.location_id === location.id && count.status === 'approved')
        .sort((a, b) => new Date(b.reviewed_at || b.updated_at || 0).getTime() - new Date(a.reviewed_at || a.updated_at || 0).getTime())[0];

      // Staff resolution
      const manager = location.managerUserId ? availableMembers.find((m) => m.id === location.managerUserId) || null : null;
      const assignedUserIds = availableAssignments.filter((a) => a.location_id === location.id).map((a) => a.user_id);
      const assignedStaff = availableMembers.filter((m) => assignedUserIds.includes(m.id));

      const todayStr = new Date().toISOString().slice(0, 10);
      const activeShiftsNow = shifts.filter(
        (s) => s.locationId === location.id && (s.shiftDate === todayStr || s.clockInAt?.startsWith(todayStr)) && !s.clockOutAt
      ).length;

      return {
        location,
        skuCount: new Set(locationLots.map((lot) => lot.productId)).size,
        units: locationLots.reduce((sum, lot) => sum + lot.quantityOnHand, 0),
        value,
        expiring,
        lowStock,
        pendingTransfers,
        lastCompletedCount: lastCompletedCount ? (lastCompletedCount.reviewed_at || lastCompletedCount.updated_at) : null,
        manager,
        assignedStaff,
        assignedUserIds,
        activeShiftsNow,
        _productMap: productMap,
      };
    });
  }, [availableAssignments, availableMembers, counts, locations, lots, products, shifts, transfers]);

  // Filtered stats based on search query, column selections, and filter panel attributes
  const filteredStats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return allLocationStats.filter(({ location, manager, assignedStaff, expiring, lowStock }) => {
      // 1. Quick view type filter (from toolbar pills)
      const effectiveType = quickTypeFilter !== 'all' ? quickTypeFilter : filterType;
      if (effectiveType !== 'all' && location.type !== effectiveType) {
        return false;
      }

      // 2. Manager status filter
      if (filterManagerStatus === 'assigned' && !location.managerUserId) return false;
      if (filterManagerStatus === 'unassigned' && location.managerUserId) return false;

      // 3. Staffing level filter
      if (filterStaffing === 'has_staff' && assignedStaff.length === 0) return false;
      if (filterStaffing === 'no_staff' && assignedStaff.length > 0) return false;

      // 4. Operational health filter
      if (filterHealth === 'expiring' && expiring === 0) return false;
      if (filterHealth === 'low_stock' && lowStock === 0) return false;
      if (filterHealth === 'healthy' && (expiring > 0 || lowStock > 0)) return false;

      // 5. Text search across selected columns
      if (query) {
        const matches: boolean[] = [];
        if (selectedColumns.name) {
          matches.push(Boolean(location.name?.toLowerCase().includes(query)));
        }
        if (selectedColumns.address) {
          matches.push(Boolean(location.address?.toLowerCase().includes(query)));
        }
        if (selectedColumns.manager) {
          const managerName = manager ? (manager.full_name || manager.email || '') : '';
          matches.push(Boolean(managerName.toLowerCase().includes(query)));
        }
        if (selectedColumns.phone) {
          matches.push(Boolean(location.phone?.toLowerCase().includes(query)));
        }

        const anySelected = selectedColumns.name || selectedColumns.address || selectedColumns.manager || selectedColumns.phone;
        if (anySelected && !matches.some(Boolean)) {
          return false;
        }
      }

      return true;
    });
  }, [allLocationStats, filterHealth, filterManagerStatus, filterStaffing, filterType, quickTypeFilter, searchQuery, selectedColumns]);

  // Drawer handlers
  const openCreateDrawer = () => {
    setEditingLocation(null);
    setDrawerName('');
    setDrawerType('branch');
    setDrawerAddress('');
    setDrawerPhone('');
    setDrawerManagerUserId('');
    setDrawerImageUrl('');
    setDrawerAssignedUserIds([]);
    setUploadError(null);
    setUploadingImage(false);
    setIsDragOver(false);
    setDrawerOpen(true);
  };

  const openEditDrawer = (location: Location) => {
    const existing = allLocationStats.find((s) => s.location.id === location.id);
    setEditingLocation(location);
    setDrawerName(location.name);
    setDrawerType(location.type);
    setDrawerAddress(location.address || '');
    setDrawerPhone(location.phone || '');
    setDrawerManagerUserId(location.managerUserId || '');
    setDrawerImageUrl(location.imageUrl || '');
    setDrawerAssignedUserIds(existing?.assignedUserIds || []);
    setUploadError(null);
    setUploadingImage(false);
    setIsDragOver(false);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingLocation(null);
    if (onToggleForm) onToggleForm();
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerName.trim()) return;

    setDrawerSaving(true);
    try {
      if (editingLocation) {
        // Update existing location
        await onUpdate?.(editingLocation.id, {
          name: drawerName.trim(),
          type: drawerType,
          address: drawerAddress.trim() || undefined,
          phone: drawerPhone.trim() || undefined,
          managerUserId: drawerManagerUserId || null,
          imageUrl: drawerImageUrl.trim() || null,
        });

        // Sync staff assignments if handlers available
        const currentAssigned = availableAssignments.filter((a) => a.location_id === editingLocation.id);
        const currentUserIds = currentAssigned.map((a) => a.user_id);

        // Add newly assigned users
        const toAdd = drawerAssignedUserIds.filter((uid) => !currentUserIds.includes(uid));
        for (const uid of toAdd) {
          if (onAssignLocation) {
            await onAssignLocation(uid, editingLocation.id);
          } else {
            await supabase.from('user_locations').insert({ user_id: uid, location_id: editingLocation.id });
          }
        }

        // Remove unassigned users
        const toRemove = currentAssigned.filter((a) => !drawerAssignedUserIds.includes(a.user_id));
        for (const a of toRemove) {
          if (onUnassignLocation) {
            await onUnassignLocation(a.id);
          } else {
            await supabase.from('user_locations').delete().eq('id', a.id);
          }
        }
      } else {
        // Create new location
        await onCreate?.({
          name: drawerName.trim(),
          type: drawerType,
          address: drawerAddress.trim() || undefined,
          phone: drawerPhone.trim() || undefined,
          managerUserId: drawerManagerUserId || undefined,
          imageUrl: drawerImageUrl.trim() || undefined,
        });
      }
      closeDrawer();
    } catch (err: any) {
      alert(err?.message || t('locations.saveFailed'));
    } finally {
      setDrawerSaving(false);
    }
  };

  // Export locations summary to CSV
  const exportLocationsCsv = () => {
    const headers = [
      'Name',
      'Type',
      'Address',
      'Phone',
      'Manager',
      'Staff Count',
      'SKU Count',
      'Total Units',
      'Total Value',
      'Expiry Issues',
      'Low Stock Items',
      'Pending Transfers',
      'Last Audit Date',
    ];

    const rows = filteredStats.map(({ location, manager, assignedStaff, skuCount, units, value, expiring, lowStock, pendingTransfers, lastCompletedCount }) => [
      `"${location.name.replace(/"/g, '""')}"`,
      location.type,
      `"${(location.address || '').replace(/"/g, '""')}"`,
      `"${(location.phone || '').replace(/"/g, '""')}"`,
      `"${String(manager ? manager.full_name || manager.email || 'Unassigned' : 'Unassigned').replace(/"/g, '""')}"`,
      assignedStaff.length,
      skuCount,
      units,
      value.toFixed(2),
      expiring,
      lowStock,
      pendingTransfers,
      lastCompletedCount ? new Date(lastCompletedCount).toLocaleDateString() : 'Not completed',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stocky-locations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const locationFilterContent = (
    <div className="space-y-4">
      {/* Segmented Location Type Toggle */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">{t('locations.locationType')}</span>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stocky-bg-global rounded-xl border border-stocky-border-subtle" role="tablist">
          <button
            type="button"
            onClick={() => {
              setFilterType('all');
              setQuickTypeFilter('all');
            }}
            className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-stocky-text-main shadow-xs'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('locations.allTypeCount', { count: allLocationStats.length })}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('branch');
              setQuickTypeFilter('branch');
            }}
            className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'branch'
                ? 'bg-white text-stocky-text-main shadow-xs'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('locations.branchesTypeCount', { count: allLocationStats.filter((s) => s.location.type === 'branch').length })}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterType('warehouse');
              setQuickTypeFilter('warehouse');
            }}
            className={`h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === 'warehouse'
                ? 'bg-white text-stocky-text-main shadow-xs'
                : 'text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            {t('locations.warehousesTypeCount', { count: allLocationStats.filter((s) => s.location.type === 'warehouse').length })}
          </button>
        </div>
      </div>

      {/* Search in Fields */}
      <div className="space-y-1.5 border-t border-stocky-border-subtle pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">{t('locations.searchInFields')}</span>
          <button
            type="button"
            onClick={() => setSelectedColumns({ name: true, address: true, manager: true, phone: true })}
            className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer font-medium"
          >
            {t('locations.selectAll')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
            <input
              type="checkbox"
              checked={selectedColumns.name}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, name: e.target.checked }))}
              className="accent-stocky-primary rounded"
            />
            <span className="truncate">{t('locations.colName')}</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
            <input
              type="checkbox"
              checked={selectedColumns.address}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, address: e.target.checked }))}
              className="accent-stocky-primary rounded"
            />
            <span className="truncate">{t('locations.colAddress')}</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
            <input
              type="checkbox"
              checked={selectedColumns.manager}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, manager: e.target.checked }))}
              className="accent-stocky-primary rounded"
            />
            <span className="truncate">{t('locations.colManager')}</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
            <input
              type="checkbox"
              checked={selectedColumns.phone}
              onChange={(e) => setSelectedColumns((prev) => ({ ...prev, phone: e.target.checked }))}
              className="accent-stocky-primary rounded"
            />
            <span className="truncate">{t('locations.colPhone')}</span>
          </label>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="space-y-2 border-t border-stocky-border-subtle pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">{t('locations.filterByAttributes')}</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="block text-xs font-medium text-stocky-text-main">
            {t('locations.branchManager')}
            <select
              value={filterManagerStatus}
              onChange={(e) => setFilterManagerStatus(e.target.value as any)}
              className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="all">{t('locations.allManagerStatuses')}</option>
              <option value="assigned">{t('locations.managerAssigned')}</option>
              <option value="unassigned">{t('locations.noManagerAssigned')}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('locations.staffingLevel')}
            <select
              value={filterStaffing}
              onChange={(e) => setFilterStaffing(e.target.value as any)}
              className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="all">{t('locations.anyStaffCount')}</option>
              <option value="has_staff">{t('locations.hasStaffMembers')}</option>
              <option value="no_staff">{t('locations.noStaffAssigned')}</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-stocky-text-main">
            {t('locations.operationalHealth')}
            <select
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value as any)}
              className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
            >
              <option value="all">{t('locations.allOperationalStatuses')}</option>
              <option value="expiring">{t('locations.hasExpiryIssues')}</option>
              <option value="low_stock">{t('locations.hasLowStock')}</option>
              <option value="healthy">{t('locations.healthyStock')}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="stocky-locations-workspace flex flex-col gap-6">
      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-xs flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <StandardToolbarWidget
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t('locations.searchPlaceholder')}
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterPanelOpen}
            onToggleFilter={() => setIsFilterPanelOpen((open) => !open)}
            primaryAction={
              canManage
                ? {
                    label: t('locations.addLocation'),
                    shortLabel: t('locations.add'),
                    icon: <PlusIcon size="xs" />,
                    onClick: openCreateDrawer,
                    title: t('locations.addLocation'),
                  }
                : undefined
            }
            moreActions={[
              {
                label: t('locations.export'),
                icon: <CloudDownloadIcon size="xs" />,
                onClick: exportLocationsCsv,
                description: t('locations.exportDesc'),
              },
            ]}
          />

          {/* Floating Column Filter Panel (Desktop) */}
          {isFilterPanelOpen && (
            <div
              ref={filterPanelRef}
              className="hidden sm:flex stocky-column-filter-panel absolute top-full start-3 sm:start-3.5 mt-1 z-40"
              role="dialog"
              aria-label={t('locations.filtersTitle')}
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-white px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <FilterIcon size="xs" className="text-stocky-primary" />
                  <h3 className="text-xs font-semibold text-stocky-text-main">{t('locations.filtersTitle')}</h3>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                      {t('locations.activeCount', { count: activeFilterCount })}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
                  >
                    {t('locations.resetAll')}
                  </button>
                )}
              </div>

              <div className="stocky-column-filter-panel__body p-4">
                {locationFilterContent}
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-4 py-2">
                <span className="text-[11px] font-medium text-stocky-text-sub">
                  {filteredStats.length === 1
                    ? t('locations.matchingLocations', { count: filteredStats.length })
                    : t('locations.matchingLocationsPlural', { count: filteredStats.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="h-7 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white hover:bg-stocky-primary-hover cursor-pointer"
                >
                  {t('locations.done')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Bottom Sheet */}
        <div className="sm:hidden">
          <BottomSheet
            mobileOnly
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            title={t('locations.filtersTitle')}
            activeCount={activeFilterCount}
            onReset={activeFilterCount > 0 ? resetFilters : undefined}
            footer={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-stocky-text-sub">
                  {filteredStats.length === 1
                    ? t('locations.matchingLocations', { count: filteredStats.length })
                    : t('locations.matchingLocationsPlural', { count: filteredStats.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFilterPanelOpen(false)}
                  className="h-9 px-5 rounded-full bg-stocky-primary text-white text-xs font-semibold cursor-pointer"
                >
                  {t('locations.applyFilters')}
                </button>
              </div>
            }
          >
            <div className="p-1">
              {locationFilterContent}
            </div>
          </BottomSheet>
        </div>

        {/* Integrated Data View (Horizontal Cards) */}
        <div className="p-3 sm:p-4 w-full">
          {filteredStats.length > 0 ? (
            <div className="flex flex-col gap-3.5">
              {filteredStats.map(
                ({
                  location,
                  skuCount,
                  units,
                  value,
                  expiring,
                  lowStock,
                  pendingTransfers,
                  lastCompletedCount,
                  manager,
                  assignedStaff,
                  activeShiftsNow,
                }) => (
                  <div
                    key={location.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenStock(location.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenStock(location.id);
                      }
                    }}
                    className="group relative flex flex-col rounded-2xl bg-white border border-stocky-border-subtle p-4 sm:p-5 shadow-2xs hover:border-stocky-border-strong hover:shadow-xs transition-all duration-200 cursor-pointer text-start gap-3.5"
                  >
                    {/* Header: Facility Identity & Quick Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      {/* Left: Avatar/Icon + Facility Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Avatar / Thumbnail */}
                        {location.imageUrl ? (
                          <div
                            className="relative h-12 w-12 sm:h-13 sm:w-13 shrink-0 rounded-xl overflow-hidden border border-stocky-border-subtle bg-stocky-bg-subtle group/thumb"
                            onClick={canManage ? (e) => { e.stopPropagation(); openEditDrawer(location); } : undefined}
                            title={canManage ? t('locations.editLocationTitle') : undefined}
                          >
                            <img
                              src={location.imageUrl}
                              alt={location.name}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                            {canManage && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <CameraIcon size="xs" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="relative flex h-12 w-12 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-xl bg-stocky-bg-global border border-stocky-border-subtle text-stocky-primary shadow-2xs group/thumb"
                            onClick={canManage ? (e) => { e.stopPropagation(); openEditDrawer(location); } : undefined}
                            title={canManage ? t('locations.editLocationTitle') : undefined}
                          >
                            {location.type === 'warehouse' ? <WarehouseIcon size="md" /> : <BoxIcon size="md" />}
                            {canManage && (
                              <div className="absolute inset-0 rounded-xl bg-stocky-primary/10 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-stocky-primary">
                                <CameraIcon size="xs" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Identity, Tags, Address */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors truncate">
                              {location.name}
                            </h3>

                            {/* Type Badge */}
                            <span className="inline-flex items-center gap-1 rounded-full bg-stocky-bg-global px-2.5 py-0.5 text-[10px] font-semibold text-stocky-text-sub border border-stocky-border-subtle">
                              {location.type === 'warehouse' ? <WarehouseIcon size="xs" /> : <BoxIcon size="xs" />}
                              <span>{location.type === 'warehouse' ? t('locations.warehouse') : t('locations.branch')}</span>
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                                location.isActive ? 'stocky-status-success' : 'stocky-status-muted'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${location.isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                              <span>{location.isActive ? t('locations.active') : t('locations.archived')}</span>
                            </span>
                          </div>

                          {/* Address & Phone */}
                          <p className="text-xs text-stocky-text-sub truncate mt-1 flex items-center gap-2">
                            <span>{location.address || t('locations.addressNotRegistered')}</span>
                            {location.phone && (
                              <>
                                <span className="text-stocky-border-strong">·</span>
                                <span>{location.phone}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Desktop Action Controls */}
                      <div className="hidden sm:flex items-center gap-2 shrink-0 self-start">
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDrawer(location);
                            }}
                            className="h-8.5 px-3 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global hover:border-stocky-border-strong transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            title={t('locations.editLocationTitle')}
                          >
                            <EditIcon size="xs" />
                            <span>{t('locations.edit')}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrLocation(location);
                          }}
                          className="h-8.5 px-3 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                          title={t('locations.attendanceQrTitle')}
                        >
                          <QrCodeIcon size="xs" />
                          <span>{t('locations.attendanceQr')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStock(location.id);
                          }}
                          className="h-8.5 px-3.5 rounded-full border border-stocky-border-subtle bg-stocky-bg-global hover:bg-stocky-primary/10 hover:border-stocky-primary hover:text-stocky-primary text-xs font-medium text-stocky-text-main transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{t('locations.viewInventory')}</span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Operations & Inventory Health Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-stocky-border-subtle/70">
                      {/* Left: Operational & Staffing Strip */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 py-2 px-3 sm:px-3.5 rounded-xl bg-stocky-bg-global/70 border border-stocky-border-subtle text-xs">
                        {/* Manager */}
                        <div className="flex items-center gap-2 min-w-0">
                          {manager ? (
                            <UserAvatar
                              src={manager.avatar_url}
                              name={manager.full_name}
                              email={manager.email}
                              size="xs"
                              className="ring-1 ring-white shrink-0"
                            />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[9px] shrink-0">
                              <UsersIcon size="xs" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-stocky-text-sub block leading-tight">
                              {t('locations.branchManager')}
                            </span>
                            <span className="text-xs font-medium text-stocky-text-main truncate block">
                              {manager ? (
                                manager.full_name || manager.email
                              ) : (
                                <span className="text-amber-700">{t('locations.notAssigned')}</span>
                              )}
                            </span>
                          </div>
                          {canManage && !manager && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDrawer(location);
                              }}
                              className="text-[11px] font-medium text-stocky-primary hover:underline ms-1 cursor-pointer"
                            >
                              {t('locations.assignBtn')}
                            </button>
                          )}
                        </div>

                        <div className="h-4 w-px bg-stocky-border-subtle hidden sm:block" />

                        {/* Staff members */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-stocky-text-sub">
                            {t('locations.staffLabel')}
                          </span>
                          {assignedStaff.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center -space-x-1.5 rtl:space-x-reverse shrink-0" title={assignedStaff.map((s) => s.full_name || s.email).join(', ')}>
                                {assignedStaff.slice(0, 3).map((member) => (
                                  <UserAvatar
                                    key={member.id}
                                    src={member.avatar_url}
                                    name={member.full_name}
                                    email={member.email}
                                    size="xs"
                                    className="ring-1 ring-white"
                                  />
                                ))}
                                {assignedStaff.length > 3 && (
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-stocky-border-subtle text-[8px] font-bold text-stocky-text-sub">
                                    +{assignedStaff.length - 3}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-medium text-stocky-text-main">
                                ({assignedStaff.length})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-stocky-text-sub italic">{t('locations.noneAssigned')}</span>
                          )}
                        </div>

                        <div className="h-4 w-px bg-stocky-border-subtle hidden sm:block" />

                        {/* Live Shifts */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-stocky-text-sub">
                            {t('locations.onDutyNow')}:
                          </span>
                          {activeShiftsNow > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{t('locations.workingCount', { count: activeShiftsNow })}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-stocky-text-sub">{t('locations.zeroClockedIn')}</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Stock Metrics & Health Indicators */}
                      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0">
                        {/* SKUs & Units Numbers */}
                        <div className="flex items-center gap-3 bg-stocky-bg-global/50 border border-stocky-border-subtle rounded-xl px-3 py-1.5">
                          <div className="text-start">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-stocky-text-sub block leading-tight">
                              {t('locations.activeSkus')}
                            </span>
                            <span className="text-sm font-bold text-stocky-text-main">
                              {skuCount}
                            </span>
                          </div>
                          <div className="h-5 w-px bg-stocky-border-subtle" />
                          <div className="text-start">
                            <span className="text-[9px] uppercase font-bold tracking-wider text-stocky-text-sub block leading-tight">
                              {t('locations.totalUnits')}
                            </span>
                            <span className="text-sm font-bold text-stocky-text-main">
                              {units.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Operational Health Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {expiring > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border stocky-status-hold px-2.5 py-0.5 text-[10px] font-medium">
                              <ClockIcon size="xs" /> {t('locations.expiringCount', { count: expiring })}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border stocky-status-success px-2.5 py-0.5 text-[10px] font-medium">
                              <CheckIcon size="xs" /> {t('locations.expiryHealthy')}
                            </span>
                          )}

                          {pendingTransfers > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border stocky-status-info px-2.5 py-0.5 text-[10px] font-medium">
                              <BoxesIcon size="xs" /> {t('locations.inTransitCount', { count: pendingTransfers })}
                            </span>
                          )}

                          {lowStock > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border stocky-status-critical px-2.5 py-0.5 text-[10px] font-medium">
                              <AlertCircleIcon size="xs" /> {t('locations.lowStockCount', { count: lowStock })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Last Physical Count & Mobile Action Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stocky-border-subtle/50 text-[11px] text-stocky-text-sub">
                      <div className="flex items-center gap-1.5 truncate">
                        <ClockIcon size="xs" className="text-stocky-text-sub/60 shrink-0" />
                        <span className="truncate">
                          {t('locations.lastCount', {
                            date: lastCompletedCount ? new Date(lastCompletedCount).toLocaleDateString() : t('locations.notRecorded'),
                          })}
                        </span>
                      </div>

                      {/* Mobile-only Action Buttons */}
                      <div className="flex sm:hidden items-center gap-2 pt-2 border-t border-stocky-border-subtle/40 w-full">
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDrawer(location);
                            }}
                            className="h-9 px-3 flex-1 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <EditIcon size="xs" />
                            <span>{t('locations.edit')}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQrLocation(location);
                          }}
                          className="h-9 px-3 flex-1 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <QrCodeIcon size="xs" />
                          <span>{t('locations.qrPoster')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStock(location.id);
                          }}
                          className="h-9 px-3.5 flex-1 rounded-full border border-stocky-border-subtle bg-stocky-bg-global text-xs font-medium text-stocky-text-main inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>{t('locations.viewInventory')}</span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-2xl bg-white px-6 py-16 text-center">
              <BoxesIcon size="md" className="mx-auto text-stocky-text-sub/50" />
              <h2 className="mt-3 text-base font-semibold text-stocky-text-main">{t('locations.noLocationsFound')}</h2>
              <p className="mt-1 text-sm text-stocky-text-sub">
                {searchQuery || activeFilterCount > 0
                  ? t('locations.adjustFiltersDesc')
                  : t('locations.createLocationPrompt')}
              </p>
              {(searchQuery || activeFilterCount > 0) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    resetFilters();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stocky-bg-global px-4 py-2 text-xs font-medium text-stocky-text-main hover:bg-stocky-border-subtle cursor-pointer"
                >
                  {t('locations.clearAllFilters')}
                </button>
              ) : canManage ? (
                <button
                  type="button"
                  onClick={openCreateDrawer}
                  className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <PlusIcon size="xs" /> {t('locations.addLocation')}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* SideDrawer: Create & Edit Location */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        ariaLabel={editingLocation ? t('locations.editSpecificLocation', { name: editingLocation.name }) : t('locations.addLocation')}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-stocky-border-subtle px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-stocky-text-main">
                {editingLocation ? t('locations.editLocation') : t('locations.addNewLocation')}
              </h2>
              <p className="text-xs text-stocky-text-sub mt-0.5">
                {editingLocation
                  ? t('locations.editLocationDesc')
                  : t('locations.addNewLocationDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global cursor-pointer"
              aria-label={t('locations.closeDrawer')}
            >
              <XIcon size="xs" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form id="location-drawer-form" onSubmit={handleSaveLocation} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Basic Information */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                {t('locations.locationDetails')}
              </span>

              <div>
                <label className="block text-xs font-medium text-stocky-text-main">
                  {t('locations.locationNameRequired')}
                  <input
                    type="text"
                    required
                    value={drawerName}
                    onChange={(e) => setDrawerName(e.target.value)}
                    placeholder={t('locations.locationNamePlaceholder')}
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-stocky-text-main">
                  {t('locations.type')}
                  <select
                    value={drawerType}
                    onChange={(e) => setDrawerType(e.target.value as any)}
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  >
                    <option value="branch">{t('locations.typeBranchOption')}</option>
                    <option value="warehouse">{t('locations.typeWarehouseOption')}</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-stocky-text-main">
                  {t('locations.phoneNumber')}
                  <input
                    type="text"
                    value={drawerPhone}
                    onChange={(e) => setDrawerPhone(e.target.value)}
                    placeholder={t('locations.phonePlaceholder')}
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-stocky-text-main">
                  {t('locations.address')}
                  <input
                    type="text"
                    value={drawerAddress}
                    onChange={(e) => setDrawerAddress(e.target.value)}
                    placeholder={t('locations.addressInputPlaceholder')}
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Branch Cover Photo Section */}
            <div className="space-y-3 border-t border-stocky-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                  {t('locations.branchCoverPhoto')}
                </span>
                {drawerImageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerImageUrl('');
                      setUploadError(null);
                    }}
                    className="text-[11px] font-medium text-rose-600 hover:underline cursor-pointer"
                  >
                    {t('locations.removePhoto')}
                  </button>
                )}
              </div>

              {/* Uploaded Photo Preview */}
              {drawerImageUrl ? (
                <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-stocky-border-subtle bg-slate-100 group shadow-xs">
                  <img
                    src={drawerImageUrl}
                    alt={t('locations.coverPreviewAlt')}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-between p-3.5">
                    <div className="flex justify-end">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-2.5 py-1 text-[10px] font-medium text-white shadow-xs">
                        <CheckIcon size="xs" className="text-stocky-accent" />
                        <span>{t('locations.savedToPrivate')}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="rounded-lg bg-white/95 hover:bg-white px-3 py-1.5 text-xs font-semibold text-stocky-text-main shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                      >
                        <CameraIcon size="xs" />
                        <span>{t('locations.replacePhoto')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerImageUrl('');
                          setUploadError(null);
                        }}
                        className="rounded-lg bg-rose-600/90 hover:bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
                      >
                        {t('locations.remove')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Direct File Upload Dropzone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                    isDragOver
                      ? 'border-stocky-primary bg-stocky-primary/5 ring-4 ring-stocky-primary/10'
                      : 'border-stocky-border-subtle bg-stocky-bg-subtle hover:border-stocky-primary/50 hover:bg-stocky-bg-hover'
                  } ${uploadingImage ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-stocky-border-subtle text-stocky-primary group-hover:scale-110 transition-transform mb-2">
                    {uploadingImage ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-stocky-primary border-t-transparent" />
                    ) : (
                      <CameraIcon size="sm" />
                    )}
                  </div>

                  <p className="text-xs font-semibold text-stocky-text-main">
                    {uploadingImage ? t('locations.uploadingToStorage') : t('locations.uploadCoverPhoto')}
                  </p>
                  <p className="mt-1 text-[11px] text-stocky-text-sub max-w-[280px]">
                    {t('locations.dragDropPrompt')}{' '}
                    <span className="font-semibold text-stocky-primary underline underline-offset-2">{t('locations.browseFiles')}</span>
                  </p>
                  <p className="mt-2 text-[10px] text-stocky-text-sub/80">
                    {t('locations.privateStorageHint')}
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = '';
                }}
              />

              {/* Upload Error Banner */}
              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  <AlertCircleIcon size="xs" className="shrink-0 text-rose-500" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>

            {/* Branch Manager Assignment */}
            <div className="space-y-3 border-t border-stocky-border-subtle pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                {t('locations.branchManager')}
              </span>

              <label className="block text-xs font-medium text-stocky-text-main">
                {t('locations.assignedManager')}
                <select
                  value={drawerManagerUserId}
                  onChange={(e) => setDrawerManagerUserId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                >
                  <option value="">{t('locations.noManagerAssigned')}</option>
                  {availableMembers
                    .filter((m) => ['manager', 'admin', 'owner'].includes(m.role || ''))
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || member.email} ({member.role || 'manager'})
                      </option>
                    ))}
                </select>
              </label>
            </div>

            {/* Assigned Staffers (Checklist multi-select) */}
            <div className="space-y-3 border-t border-stocky-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                    {t('locations.staffMembersAssigned', { count: drawerAssignedUserIds.length })}
                  </span>
                  <p className="text-[11px] text-stocky-text-sub mt-0.5">
                    {t('locations.staffMembersSubtitle')}
                  </p>
                </div>
                {availableMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (drawerAssignedUserIds.length === availableMembers.length) {
                        setDrawerAssignedUserIds([]);
                      } else {
                        setDrawerAssignedUserIds(availableMembers.map((m) => m.id));
                      }
                    }}
                    className="text-[11px] text-stocky-primary hover:underline cursor-pointer"
                  >
                    {drawerAssignedUserIds.length === availableMembers.length ? t('locations.deselectAll') : t('locations.selectAll')}
                  </button>
                )}
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle divide-y divide-stocky-border-subtle">
                {availableMembers.map((member) => {
                  const isChecked = drawerAssignedUserIds.includes(member.id);
                  return (
                    <label
                      key={member.id}
                      className={`flex items-center justify-between gap-3 p-2.5 text-xs transition-colors cursor-pointer hover:bg-stocky-bg-global ${isChecked ? 'bg-stocky-bg-global/50' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={member.avatar_url}
                          name={member.full_name}
                          email={member.email}
                          size="sm"
                          className="ring-1 ring-stocky-border-subtle shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-stocky-text-main truncate">
                            {member.full_name || member.email}
                          </p>
                          <p className="text-[10px] text-stocky-text-sub capitalize">
                            {member.role || 'staff'}
                          </p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDrawerAssignedUserIds((prev) => [...prev, member.id]);
                          } else {
                            setDrawerAssignedUserIds((prev) => prev.filter((id) => id !== member.id));
                          }
                        }}
                        className="accent-stocky-primary rounded h-4 w-4 cursor-pointer shrink-0"
                      />
                    </label>
                  );
                })}
                {availableMembers.length === 0 && (
                  <p className="p-4 text-center text-xs text-stocky-text-sub">{t('locations.noTeamMembersAvailable')}</p>
                )}
              </div>
            </div>
          </form>

          {/* Drawer Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 border-t border-stocky-border-subtle bg-stocky-bg-global px-5 py-3">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={drawerSaving}
              className="h-10 rounded-full border border-stocky-border-subtle bg-white px-5 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer"
            >
              {t('locations.cancel')}
            </button>
            <button
              type="submit"
              form="location-drawer-form"
              disabled={drawerSaving || !drawerName.trim()}
              className="h-10 rounded-full bg-stocky-primary px-6 text-xs font-medium text-white hover:bg-stocky-primary-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {drawerSaving
                ? t('locations.saving')
                : editingLocation
                  ? t('locations.updateLocation')
                  : t('locations.createLocation')}
            </button>
          </div>
        </div>
      </SideDrawer>



      {/* Attendance QR Poster Drawer */}
      <SideDrawer
        isOpen={Boolean(qrLocation)}
        onClose={() => setQrLocation(null)}
        ariaLabel={qrLocation ? t('locations.qrPosterAria', { name: qrLocation.name }) : ''}
      >
        {qrLocation && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stocky-border-subtle px-5 py-4 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-stocky-text-main">
                  {t('locations.attendanceQrHeader', { name: qrLocation.name })}
                </h2>
                <p className="text-xs text-stocky-text-sub mt-0.5">
                  {t('locations.attendanceQrSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrLocation(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main cursor-pointer"
                aria-label={t('locations.closeModal')}
              >
                <XIcon size="xs" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-stocky-primary/10 text-stocky-primary flex items-center justify-center mb-3">
                <QrCodeIcon size="md" />
              </div>
              <h3 className="text-base font-bold text-stocky-text-main">
                {qrLocation.name}
              </h3>
              <p className="text-xs text-stocky-text-sub mt-0.5 max-w-xs">
                {qrLocation.address || t('locations.registeredEntrance')} · {qrLocation.type === 'warehouse' ? t('locations.warehouse') : t('locations.branch')}
              </p>

              {/* QR Card Preview */}
              <div className="my-6 p-6 rounded-2xl border-2 border-dashed border-stocky-border-subtle bg-stocky-bg-global/30 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=stocky:branch:${qrLocation.id}`}
                  alt={t('locations.qrCodeAlt', { name: qrLocation.name })}
                  className="w-56 h-56 rounded-xl object-contain bg-white p-2 shadow-xs"
                />
                <div className="mt-4 text-xs font-mono font-semibold text-stocky-text-sub bg-white border border-stocky-border-subtle px-3 py-1 rounded-full">
                  {t('locations.branchToken', { token: qrLocation.id.slice(0, 8) })}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stocky-bg-global/60 border border-stocky-border-subtle text-start w-full text-xs text-stocky-text-sub space-y-1.5">
                <div className="font-semibold text-stocky-text-main flex items-center gap-1.5">
                  <CheckIcon size="xs" className="text-stocky-status-success-fg" />
                  <span>{t('locations.checkInProtocol')}</span>
                </div>
                <p>
                  {t('locations.checkInProtocolDesc')}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-stocky-border-subtle px-5 py-3.5 bg-white flex items-center justify-between shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setQrLocation(null)}
                className="h-9 px-4 rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-sub hover:text-stocky-text-main cursor-pointer"
              >
                {t('locations.close')}
              </button>
              <div className="flex items-center gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=stocky:branch:${qrLocation.id}`}
                  download={`${qrLocation.name.toLowerCase().replace(/\s+/g, '-')}-qr-poster.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-3.5 rounded-full border border-stocky-border-subtle bg-white text-xs font-medium text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <CloudDownloadIcon size="xs" />
                  <span>{t('locations.downloadPng')}</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-9 px-4 rounded-full bg-stocky-primary text-white text-xs font-semibold hover:bg-stocky-primary-hover transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <QrCodeIcon size="xs" />
                  <span>{t('locations.printPoster')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
}

