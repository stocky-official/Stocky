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
  SearchIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import type { InventoryTransfer, Location, Product, StockLot } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { supabase } from '@/lib/supabase/client';

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
      setUploadError('Please select an image file (PNG, JPG, JPEG, WEBP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be 5MB or less.');
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
            .eq('id', user.id)
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
      setUploadError(err?.message || 'Failed to upload image to private storage.');
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
        _productMap: productMap,
      };
    });
  }, [availableAssignments, availableMembers, counts, locations, lots, products, transfers]);

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
      alert(err?.message || 'Failed to save location.');
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

  return (
    <div className="stocky-locations-workspace flex flex-col gap-6">
      {/* Search & Buttons Toolbar (matching Stock and Suppliers workspaces) */}
      <section className="stocky-stock-filterbar stocky-locations-filterbar">
        <div className="stocky-stock-table-toolbar stocky-locations-toolbar">
          {/* Split Search Field */}
          <div className="relative min-w-0 flex-1" ref={filterPanelRef}>
            <div className="stocky-split-search-field">
              <div className="stocky-split-search-field__input-wrap">
                <SearchIcon size="xs" className="pointer-events-none text-stocky-text-sub shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search branches, addresses, managers, phone..."
                  aria-label="Search locations"
                  className="stocky-split-search-field__input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-stocky-text-sub hover:text-stocky-text-main cursor-pointer shrink-0"
                    aria-label="Clear location search"
                  >
                    <XIcon size="xs" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                aria-label="Filter locations"
                aria-expanded={isFilterPanelOpen}
                className={`stocky-split-search-field__filter-btn ${isFilterPanelOpen || activeFilterCount > 0 ? 'stocky-split-search-field__filter-btn--active' : ''}`}
                title="Filter by columns"
              >
                <FilterIcon size="xs" />
                {activeFilterCount > 0 && (
                  <span className="stocky-split-search-field__badge">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Floating Column Filter Panel */}
            {isFilterPanelOpen && (
              <div className="stocky-column-filter-panel" role="dialog" aria-label="Location column filters">
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-stocky-border-subtle bg-white px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <FilterIcon size="xs" className="text-stocky-primary" />
                    <h3 className="text-xs font-semibold text-stocky-text-main">Location Filters</h3>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-stocky-primary/10 px-2 py-0.5 text-[10px] font-semibold text-stocky-primary">
                        {activeFilterCount} active
                      </span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11px] font-medium text-stocky-primary hover:underline cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                <div className="stocky-column-filter-panel__body space-y-3">
                  {/* Search in Fields */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Search In Fields</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColumns({ name: true, address: true, manager: true, phone: true })}
                        className="text-[10px] text-stocky-text-sub hover:text-stocky-primary cursor-pointer"
                      >
                        Select all
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
                        <span className="truncate">Name</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.address}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, address: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Address</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.manager}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, manager: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Manager</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-stocky-text-main cursor-pointer hover:bg-stocky-bg-global rounded px-1.5 py-1">
                        <input
                          type="checkbox"
                          checked={selectedColumns.phone}
                          onChange={(e) => setSelectedColumns((prev) => ({ ...prev, phone: e.target.checked }))}
                          className="accent-stocky-primary rounded"
                        />
                        <span className="truncate">Phone</span>
                      </label>
                    </div>
                  </div>

                  {/* Dropdown Filters */}
                  <div className="space-y-2 border-t border-stocky-border-subtle pt-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">Filter By Attributes</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="block text-xs font-medium text-stocky-text-main">
                        Location Type
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">All types</option>
                          <option value="branch">Branch only</option>
                          <option value="warehouse">Warehouse only</option>
                        </select>
                      </label>

                      <label className="block text-xs font-medium text-stocky-text-main">
                        Manager Status
                        <select
                          value={filterManagerStatus}
                          onChange={(e) => setFilterManagerStatus(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">All locations</option>
                          <option value="assigned">Manager assigned</option>
                          <option value="unassigned">No manager assigned</option>
                        </select>
                      </label>

                      <label className="block text-xs font-medium text-stocky-text-main">
                        Staffing Level
                        <select
                          value={filterStaffing}
                          onChange={(e) => setFilterStaffing(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">Any staff count</option>
                          <option value="has_staff">Has staff members</option>
                          <option value="no_staff">No staff assigned</option>
                        </select>
                      </label>

                      <label className="block text-xs font-medium text-stocky-text-main">
                        Operational Health
                        <select
                          value={filterHealth}
                          onChange={(e) => setFilterHealth(e.target.value as any)}
                          className="mt-1 h-8 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-global px-2 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
                        >
                          <option value="all">All operational statuses</option>
                          <option value="expiring">Has expiry issues</option>
                          <option value="low_stock">Has low stock</option>
                          <option value="healthy">Healthy stock</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t border-stocky-border-subtle bg-stocky-bg-global px-4 py-2">
                  <span className="text-[11px] font-medium text-stocky-text-sub">
                    {filteredStats.length} location{filteredStats.length === 1 ? '' : 's'} matching
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="h-7 rounded-full bg-stocky-primary px-3 text-xs font-medium text-white hover:bg-stocky-primary-hover cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick View Filter Pills & Action Buttons */}
          <div className="stocky-stock-table-toolbar__actions">
            {/* Quick type filter pills */}
            <div className="hidden sm:inline-flex items-center rounded-full bg-stocky-bg-global border border-stocky-border-subtle p-0.5 h-10">
              <button
                type="button"
                onClick={() => setQuickTypeFilter('all')}
                className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${quickTypeFilter === 'all' ? 'bg-white shadow-xs text-stocky-text-main font-semibold' : 'text-stocky-text-sub hover:text-stocky-text-main'}`}
              >
                All ({allLocationStats.length})
              </button>
              <button
                type="button"
                onClick={() => setQuickTypeFilter('branch')}
                className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${quickTypeFilter === 'branch' ? 'bg-white shadow-xs text-stocky-text-main font-semibold' : 'text-stocky-text-sub hover:text-stocky-text-main'}`}
              >
                Branches ({allLocationStats.filter((s) => s.location.type === 'branch').length})
              </button>
              <button
                type="button"
                onClick={() => setQuickTypeFilter('warehouse')}
                className={`h-8 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer ${quickTypeFilter === 'warehouse' ? 'bg-white shadow-xs text-stocky-text-main font-semibold' : 'text-stocky-text-sub hover:text-stocky-text-main'}`}
              >
                Warehouses ({allLocationStats.filter((s) => s.location.type === 'warehouse').length})
              </button>
            </div>

            <button
              type="button"
              onClick={exportLocationsCsv}
              className="stocky-table-toolbar-button"
              title="Export locations report"
            >
              <CloudDownloadIcon size="xs" /> Export
            </button>
            {canManage && (
              <button
                type="button"
                onClick={openCreateDrawer}
                className="stocky-table-toolbar-button stocky-table-toolbar-button--primary"
              >
                <PlusIcon size="xs" /> Add location
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Locations Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              className="group flex flex-col rounded-2xl bg-white border border-stocky-border-subtle shadow-xs hover:border-stocky-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden text-left"
            >
              {/* Branch Cover Header (with photo or curated architectural header) */}
              {location.imageUrl ? (
                <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                  <img
                    src={location.imageUrl}
                    alt={location.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

                  {/* Top Header floating badge & actions */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-stocky-text-main shadow-xs">
                      {location.type === 'warehouse' ? <WarehouseIcon size="xs" /> : <BoxIcon size="xs" />}
                      <span>{location.type === 'warehouse' ? 'Warehouse' : 'Branch'}</span>
                    </span>

                    {canManage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDrawer(location);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-stocky-text-main transition-colors shadow-xs cursor-pointer"
                        title="Edit location"
                      >
                        <EditIcon size="xs" />
                      </button>
                    )}
                  </div>

                  {/* Bottom title on image banner */}
                  <div className="absolute bottom-3 inset-x-3 text-white">
                    <h2 className="text-base font-semibold drop-shadow-sm truncate">{location.name}</h2>
                    <p className="text-xs text-white/90 drop-shadow-sm truncate mt-0.5">
                      {location.address || 'Address not registered'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#F5F7F0] via-[#EBF1E5] to-slate-100 p-4 border-b border-stocky-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-stocky-text-main border border-stocky-border-subtle shadow-xs">
                      {location.type === 'warehouse' ? <WarehouseIcon size="xs" /> : <BoxIcon size="xs" />}
                      <span>{location.type === 'warehouse' ? 'Warehouse' : 'Branch'}</span>
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDrawer(location);
                          }}
                          className="flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[10px] font-medium text-stocky-text-sub hover:text-stocky-primary border border-stocky-border-subtle shadow-xs transition-colors cursor-pointer"
                          title="Add branch photo"
                        >
                          <CameraIcon size="xs" />
                          <span>Add photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDrawer(location);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stocky-text-main hover:text-stocky-primary border border-stocky-border-subtle shadow-xs transition-colors cursor-pointer"
                          title="Edit location"
                        >
                          <EditIcon size="xs" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <h2 className="text-base font-semibold text-stocky-text-main truncate">{location.name}</h2>
                    <p className="text-xs text-stocky-text-sub truncate mt-0.5">
                      {location.address || 'Address not registered'}
                    </p>
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex flex-col gap-4 flex-1 justify-between">
                {/* Staff & Manager Cardlet (Highlight requested by user) */}
                <div className="rounded-widget bg-stocky-bg-subtle border border-stocky-border-subtle p-3 flex flex-col gap-3">
                  {/* Manager Row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {manager ? (
                        <UserAvatar
                          src={manager.avatar_url}
                          name={manager.full_name}
                          email={manager.email}
                          size="md"
                          variant="solid"
                          className="ring-2 ring-white shrink-0"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs shrink-0">
                          <UsersIcon size="xs" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-stocky-text-sub">
                          Branch Manager
                        </p>
                        <p className="text-xs font-semibold text-stocky-text-main truncate">
                          {manager ? (
                            manager.full_name || manager.email
                          ) : (
                            <span className="text-amber-700 font-medium">No manager assigned</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {canManage && !manager && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDrawer(location);
                        }}
                        className="text-[11px] font-medium text-stocky-primary hover:underline shrink-0 cursor-pointer"
                      >
                        Assign
                      </button>
                    )}
                  </div>

                  {/* Staffers Count & Overlapping Avatar Stack */}
                  <div className="flex items-center justify-between border-t border-stocky-border-subtle/80 pt-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-stocky-text-sub text-[11px]">
                      <UsersIcon size="xs" className="text-stocky-text-sub/80 shrink-0" />
                      <span>
                        <strong className="font-semibold text-stocky-text-main">{assignedStaff.length}</strong>{' '}
                        {assignedStaff.length === 1 ? 'staffer' : 'staffers'}
                      </span>
                    </div>

                    {assignedStaff.length > 0 ? (
                      <div className="flex items-center -space-x-1.5 shrink-0" title={assignedStaff.map((s) => s.full_name || s.email).join(', ')}>
                        {assignedStaff.slice(0, 4).map((member) => (
                          <div key={member.id} className="relative">
                            <UserAvatar
                              src={member.avatar_url}
                              name={member.full_name}
                              email={member.email}
                              size="xs"
                              className="ring-2 ring-white"
                            />
                          </div>
                        ))}
                        {assignedStaff.length > 4 && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stocky-bg-global ring-2 ring-white text-[9px] font-bold text-stocky-text-sub">
                            +{assignedStaff.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stocky-text-sub italic">No staff assigned</span>
                    )}
                  </div>
                </div>

                {/* Inventory Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-0.5">
                  <div className="rounded-xl bg-stocky-bg-global/70 p-2.5 text-center">
                    <p className="text-[10px] font-medium text-stocky-text-sub uppercase tracking-wider">Products</p>
                    <p className="text-sm font-semibold text-stocky-text-main mt-0.5">{skuCount}</p>
                  </div>
                  <div className="rounded-xl bg-stocky-bg-global/70 p-2.5 text-center">
                    <p className="text-[10px] font-medium text-stocky-text-sub uppercase tracking-wider">Units</p>
                    <p className="text-sm font-semibold text-stocky-text-main mt-0.5">{units.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-stocky-bg-global/70 p-2.5 text-center">
                    <p className="text-[10px] font-medium text-stocky-text-sub uppercase tracking-wider">Value</p>
                    <p className="text-sm font-semibold text-stocky-text-main mt-0.5">
                      {value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Operational Health Status Pills */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 border ${expiring ? 'stocky-status-warning font-medium' : 'stocky-status-success'}`}
                  >
                    <ClockIcon size="xs" /> {expiring} expiry issue{expiring === 1 ? '' : 's'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 border ${lowStock ? 'stocky-status-critical font-medium' : 'stocky-status-muted'}`}
                  >
                    <AlertCircleIcon size="xs" /> {lowStock} low stock
                  </span>
                </div>

                {/* Transfer & Count Summary */}
                <p className="text-[11px] text-stocky-text-sub truncate">
                  {pendingTransfers} pending transfer{pendingTransfers === 1 ? '' : 's'} · Last count:{' '}
                  {lastCompletedCount ? new Date(lastCompletedCount).toLocaleDateString() : 'Not completed'}
                </p>

                {/* Card Footer Actions */}
                <div className="pt-2.5 border-t border-stocky-border-subtle flex items-center justify-between text-xs">
                  <span className="font-medium text-stocky-primary inline-flex items-center gap-1 group-hover:underline">
                    Open location stock <ChevronRightIcon size="xs" />
                  </span>
                  {location.phone && (
                    <span className="text-[11px] text-stocky-text-sub">{location.phone}</span>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </section>

      {/* Empty State */}
      {filteredStats.length === 0 && (
        <div className="rounded-2xl bg-white border border-stocky-border-subtle px-6 py-16 text-center">
          <BoxesIcon size="md" className="mx-auto text-stocky-text-sub/50" />
          <h2 className="mt-3 text-base font-semibold text-stocky-text-main">No locations found</h2>
          <p className="mt-1 text-sm text-stocky-text-sub">
            {searchQuery || activeFilterCount > 0
              ? 'Try adjusting your search query or column filters.'
              : 'Create a branch or warehouse to begin managing inventory.'}
          </p>
          {(searchQuery || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                resetFilters();
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-stocky-bg-global px-4 py-1.5 text-xs font-medium text-stocky-text-main hover:bg-stocky-border-subtle cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* SideDrawer: Create & Edit Location */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        ariaLabel={editingLocation ? `Edit ${editingLocation.name}` : 'Add location'}
      >
        <div className="flex h-full flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-stocky-border-subtle px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-stocky-text-main">
                {editingLocation ? 'Edit location' : 'Add new location'}
              </h2>
              <p className="text-xs text-stocky-text-sub mt-0.5">
                {editingLocation
                  ? 'Update location details, manager, staff assignments, and branch cover photo.'
                  : 'Create a new branch or warehouse in your company structure.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global cursor-pointer"
              aria-label="Close drawer"
            >
              <XIcon size="xs" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form id="location-drawer-form" onSubmit={handleSaveLocation} className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Basic Information */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                Location Details
              </span>

              <div>
                <label className="block text-xs font-medium text-stocky-text-main">
                  Location Name *
                  <input
                    type="text"
                    required
                    value={drawerName}
                    onChange={(e) => setDrawerName(e.target.value)}
                    placeholder="e.g. Downtown Flagship, Haram Branch, Central Depot"
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-stocky-text-main">
                  Type
                  <select
                    value={drawerType}
                    onChange={(e) => setDrawerType(e.target.value as any)}
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  >
                    <option value="branch">Branch (Retail / Outlet)</option>
                    <option value="warehouse">Warehouse (Depot / Storage)</option>
                  </select>
                </label>

                <label className="block text-xs font-medium text-stocky-text-main">
                  Phone Number
                  <input
                    type="text"
                    value={drawerPhone}
                    onChange={(e) => setDrawerPhone(e.target.value)}
                    placeholder="+20 100 123 4567"
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-stocky-text-main">
                  Address
                  <input
                    type="text"
                    value={drawerAddress}
                    onChange={(e) => setDrawerAddress(e.target.value)}
                    placeholder="Street address, district, city"
                    className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {/* Branch Cover Photo Section */}
            <div className="space-y-3 border-t border-stocky-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stocky-text-sub">
                  Branch Cover Photo
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
                    Remove photo
                  </button>
                )}
              </div>

              {/* Uploaded Photo Preview */}
              {drawerImageUrl ? (
                <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-stocky-border-subtle bg-slate-100 group shadow-xs">
                  <img
                    src={drawerImageUrl}
                    alt="Cover preview"
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
                        <span>Saved to stocky-private</span>
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
                        <span>Replace photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerImageUrl('');
                          setUploadError(null);
                        }}
                        className="rounded-lg bg-rose-600/90 hover:bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all cursor-pointer"
                      >
                        Remove
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
                    {uploadingImage ? 'Uploading to company private storage...' : 'Upload branch cover photo'}
                  </p>
                  <p className="mt-1 text-[11px] text-stocky-text-sub max-w-[280px]">
                    Drag and drop your image here, or{' '}
                    <span className="font-semibold text-stocky-primary underline underline-offset-2">browse files</span>
                  </p>
                  <p className="mt-2 text-[10px] text-stocky-text-sub/80">
                    Saved directly to <span className="font-mono font-medium">stocky-private / company folder</span> · PNG, JPG, WEBP up to 5MB
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
                Branch Manager
              </span>

              <label className="block text-xs font-medium text-stocky-text-main">
                Assigned Manager
                <select
                  value={drawerManagerUserId}
                  onChange={(e) => setDrawerManagerUserId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:bg-white focus:outline-none"
                >
                  <option value="">No manager assigned</option>
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
                    Staff Members ({drawerAssignedUserIds.length} assigned)
                  </span>
                  <p className="text-[11px] text-stocky-text-sub mt-0.5">
                    Select team members assigned to work at this location.
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
                    {drawerAssignedUserIds.length === availableMembers.length ? 'Deselect all' : 'Select all'}
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
                  <p className="p-4 text-center text-xs text-stocky-text-sub">No team members available.</p>
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
              className="h-9 rounded-full border border-stocky-border-subtle bg-white px-4 text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-hover cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="location-drawer-form"
              disabled={drawerSaving || !drawerName.trim()}
              className="h-9 rounded-full bg-stocky-primary px-5 text-xs font-medium text-white hover:bg-stocky-primary-hover disabled:opacity-50 cursor-pointer"
            >
              {drawerSaving
                ? 'Saving...'
                : editingLocation
                  ? 'Update location'
                  : 'Create location'}
            </button>
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}

