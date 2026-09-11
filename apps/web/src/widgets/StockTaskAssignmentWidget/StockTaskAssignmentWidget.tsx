'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ClockIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, CreateStockTaskCommand, Location, Product, StockTaskType } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';

type TeamMember = { id: string; email: string; full_name?: string | null; avatar_url?: string | null; role: CompanyUserRole; status?: string };

export interface StockTaskAssignmentWidgetProps {
  isOpen: boolean;
  taskType: StockTaskType;
  selectedProductIds: string[];
  products: Product[];
  locations: Location[];
  members: TeamMember[];
  assignments?: Array<{ user_id: string; location_id: string }>;
  selectedLocationId: string;
  userRole: CompanyUserRole;
  onClose: () => void;
  onCreate: (input: CreateStockTaskCommand) => Promise<void>;
}

export function StockTaskAssignmentWidget({
  isOpen,
  taskType: initialTaskType,
  selectedProductIds,
  products,
  locations,
  members,
  assignments = [],
  selectedLocationId,
  userRole,
  onClose,
  onCreate,
}: StockTaskAssignmentWidgetProps) {
  const [taskType, setTaskType] = useState<StockTaskType>(initialTaskType);
  const [locationId, setLocationId] = useState(selectedLocationId === 'all' ? '' : selectedLocationId);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [note, setNote] = useState('');
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [assignedProductIds, setAssignedProductIds] = useState<string[]>(selectedProductIds);
  const [productSearch, setProductSearch] = useState('');
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignees = useMemo(() => {
    const allowedRoles: CompanyUserRole[] = userRole === 'manager' ? ['staff'] : ['manager', 'staff'];
    const candidates = members.filter((member) => allowedRoles.includes(member.role) && member.status !== 'disabled');
    if (!locationId) return candidates;
    const location = locations.find((candidate) => candidate.id === locationId);
    const assignedIds = new Set(assignments.filter((assignment) => assignment.location_id === locationId).map((assignment) => assignment.user_id));
    return candidates.filter((member) => assignedIds.has(member.id) || member.id === location?.managerUserId);
  }, [assignments, locationId, locations, members, userRole]);

  useEffect(() => {
    if (!isOpen) return;
    setTaskType(initialTaskType);
    setLocationId(selectedLocationId === 'all' ? '' : selectedLocationId);
    setLocationMenuOpen(false);
    setAssigneeId('');
    setAssigneeMenuOpen(false);
    setAssignedProductIds(selectedProductIds);
    setProductSearch('');
    setProductMenuOpen(false);
    setScheduleEnabled(false);
    setScheduledStartAt('');
    setScheduledEndAt('');
    setNote('');
    setError(null);
  }, [initialTaskType, isOpen, selectedLocationId, selectedProductIds]);

  useEffect(() => {
    if (!assigneeId || !assignees.some((member) => member.id === assigneeId)) {
      setAssigneeId(assignees[0]?.id || '');
    }
  }, [assigneeId, assignees]);

  const selectedProducts = products.filter((product) => assignedProductIds.includes(product.id));
  const availableProducts = useMemo(() => {
    const normalizedSearch = productSearch.trim().toLowerCase();
    return products
      .filter((product) => !assignedProductIds.includes(product.id))
      .filter((product) => !normalizedSearch || [product.name, product.barcode, product.categoryName].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedSearch)))
      .slice(0, 12);
  }, [assignedProductIds, productSearch, products]);
  const selectedLocation = locations.find((location) => location.id === locationId) || null;
  const selectedAssignee = assignees.find((member) => member.id === assigneeId) || null;
  const memberAvatar = (member: TeamMember, className = 'h-7 w-7') => (
    <UserAvatar
      src={member.avatar_url}
      name={member.full_name}
      email={member.email}
      size={className.includes('h-6') ? 'xs' : 'sm'}
      className={className}
    />
  );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationId) return setError('Choose the branch or warehouse for this task.');
    if (!assigneeId) return setError('Choose the person who will do this task.');
    if (assignedProductIds.length === 0) return setError('Select at least one product first.');
    if (scheduleEnabled && (!scheduledStartAt || !scheduledEndAt)) return setError('Choose both a start and end time for the work window.');
    if (scheduleEnabled && new Date(scheduledEndAt).getTime() <= new Date(scheduledStartAt).getTime()) return setError('The end time must be after the start time.');
    setSaving(true);
    setError(null);
    try {
      await onCreate({ locationId, taskType, assignedToCompanyUserId: assigneeId, productIds: assignedProductIds, note: note.trim() || null, scheduledStartAt: scheduleEnabled ? new Date(scheduledStartAt).toISOString() : null, scheduledEndAt: scheduleEnabled ? new Date(scheduledEndAt).toISOString() : null });
      onClose();
    } catch (createError: any) {
      setError(createError?.message || 'Could not create this task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel="Assign a stock check" zIndex={70}>
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div>
          <p className="stocky-page-eyebrow">Create work task</p>
          <h2 className="mt-1 text-lg font-medium text-stocky-text-main">Assign a stock check</h2>
          <p className="mt-1 text-xs text-stocky-text-sub">The assigned person sees only the products to check. Expected quantities stay hidden until you review the result.</p>
        </div>
        <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global" aria-label="Close"><XIcon size="xs" /></button>
      </div>
      <form id="stock-task-assignment-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setTaskType('count')} className={`stocky-task-type-option rounded-2xl flex h-16 items-center gap-2.5 border px-3 text-left ${taskType === 'count' ? 'border-stocky-primary bg-stocky-primary/5' : 'border-stocky-border-subtle'}`}>
            <CheckCircleIcon size="xs" className={taskType === 'count' ? 'text-stocky-primary' : 'text-stocky-text-sub'} />
            <span><span className="block text-[11px] font-medium text-stocky-text-main">Count quantities</span><span className="mt-0.5 block text-[10px] leading-tight text-stocky-text-sub">Count what is physically there.</span></span>
          </button>
          <button type="button" onClick={() => setTaskType('expiry')} className={`stocky-task-type-option rounded-2xl flex h-16 items-center gap-2.5 border px-3 text-left ${taskType === 'expiry' ? 'border-stocky-primary bg-stocky-primary/5' : 'border-stocky-border-subtle'}`}>
            <ClockIcon size="xs" className={taskType === 'expiry' ? 'text-stocky-primary' : 'text-stocky-text-sub'} />
            <span><span className="block text-[11px] font-medium text-stocky-text-main">Check expiry dates</span><span className="mt-0.5 block text-[10px] leading-tight text-stocky-text-sub">Read the date on each batch.</span></span>
          </button>
        </div>

        <div className="relative">
          <p className="text-xs font-medium text-stocky-text-main">Location</p>
          <button type="button" onClick={() => setLocationMenuOpen((current) => !current)} aria-haspopup="listbox" aria-expanded={locationMenuOpen} className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-xl border border-stocky-border-subtle px-3 text-left text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none">
            <span className="min-w-0 flex-1 truncate">{selectedLocation?.name || 'Choose location'}</span>
            {selectedLocation && <span className="text-[10px] capitalize text-stocky-text-sub">{selectedLocation.type}</span>}
            <ChevronDownIcon size="xs" className="shrink-0 text-stocky-text-sub" />
          </button>
          {locationMenuOpen && <div role="listbox" className="stocky-account-menu stocky-dropdown-panel absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-white p-1">
            <button type="button" role="option" aria-selected={!locationId} onClick={() => { setLocationId(''); setLocationMenuOpen(false); }} className={`stocky-dropdown-item w-full justify-between rounded-lg px-2 py-2 text-left ${!locationId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}>Choose location</button>
            {locations.map((location) => <button key={location.id} type="button" role="option" aria-selected={location.id === locationId} onClick={() => { setLocationId(location.id); setLocationMenuOpen(false); }} className={`stocky-dropdown-item w-full justify-between rounded-lg px-2 py-2 text-left ${location.id === locationId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}><span>{location.name}</span><span className="text-[10px] capitalize text-stocky-text-sub">{location.type}</span></button>)}
          </div>}
        </div>

        <div className="relative">
          <p className="text-xs font-medium text-stocky-text-main">Assign to</p>
          <button type="button" onClick={() => setAssigneeMenuOpen((current) => !current)} disabled={assignees.length === 0} aria-haspopup="listbox" aria-expanded={assigneeMenuOpen} className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-xl border border-stocky-border-subtle px-3 text-left text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:opacity-60">
            {selectedAssignee ? memberAvatar(selectedAssignee, 'h-6 w-6') : <span className="h-6 w-6 rounded-full bg-stocky-bg-global" />}
            <span className="min-w-0 flex-1 truncate">{selectedAssignee ? `${selectedAssignee.full_name || selectedAssignee.email} · ${selectedAssignee.role === 'manager' ? 'Manager' : 'Staff'}` : 'Choose a team member'}</span>
            <ChevronDownIcon size="xs" className="shrink-0 text-stocky-text-sub" />
          </button>
          {assigneeMenuOpen && assignees.length > 0 && <div role="listbox" className="stocky-account-menu stocky-dropdown-panel absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-white p-1">
            {assignees.map((member) => <button key={member.id} type="button" role="option" aria-selected={member.id === assigneeId} onClick={() => { setAssigneeId(member.id); setAssigneeMenuOpen(false); }} className={`stocky-dropdown-item w-full gap-2 rounded-lg px-2 py-2 text-left ${member.id === assigneeId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}>
              {memberAvatar(member, 'h-7 w-7')}<span className="min-w-0 flex-1 truncate">{member.full_name || member.email}<span className="mt-0.5 block text-[10px] text-stocky-text-sub">{member.role === 'manager' ? 'Manager' : 'Staff'}</span></span>{member.id === assigneeId && <CheckCircleIcon size="xs" />}
            </button>)}
          </div>}
        </div>
        {assignees.length === 0 && <p className="rounded-xl stocky-status-warning border px-3 py-2 text-xs">Add a staff member and assign them to this location before creating a task.</p>}

        <div className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/60 p-3">
          <label className="flex cursor-pointer items-start gap-2.5"><input type="checkbox" checked={scheduleEnabled} onChange={(event) => { setScheduleEnabled(event.target.checked); setError(null); }} className="mt-0.5 h-3.5 w-3.5 accent-stocky-primary" /><span><span className="block text-xs font-medium text-stocky-text-main">Set a work timeframe</span><span className="mt-0.5 block text-[10px] text-stocky-text-sub">Tell the assignee when this task is expected and start it automatically when the window opens.</span></span></label>
          {scheduleEnabled && <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-[11px] font-medium text-stocky-text-main">Starts<input type="datetime-local" value={scheduledStartAt} onChange={(event) => setScheduledStartAt(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2 text-xs focus:border-stocky-primary focus:outline-none" /></label><label className="text-[11px] font-medium text-stocky-text-main">Ends<input type="datetime-local" value={scheduledEndAt} onChange={(event) => setScheduledEndAt(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-white px-2 text-xs focus:border-stocky-primary focus:outline-none" /></label></div>}
        </div>

        <div className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-stocky-text-main">Products to check</p>
            <span className="rounded-full stocky-status-info border px-2 py-1 text-[11px]">{selectedProducts.length}</span>
          </div>
          <div className="relative mt-2">
            <SearchIcon size="xs" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
            <input
              value={productSearch}
              onChange={(event) => { setProductSearch(event.target.value); setProductMenuOpen(true); }}
              onFocus={() => setProductMenuOpen(true)}
              placeholder="Search products or barcodes..."
              className="h-9 w-full rounded-lg border border-stocky-border-subtle bg-white pl-8 pr-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none"
              aria-label="Search products to add to this task"
            />
            {productMenuOpen && <div className="stocky-dropdown-panel absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-stocky-border-subtle bg-white p-1 shadow-lg">
              {availableProducts.length > 0 ? availableProducts.map((product) => <button
                key={product.id}
                type="button"
                onClick={() => { setAssignedProductIds((current) => [...current, product.id]); setProductSearch(''); setProductMenuOpen(true); setError(null); }}
                className="stocky-dropdown-item flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs text-stocky-text-main hover:bg-stocky-bg-global"
              >
                <span className="min-w-0 flex-1 truncate">{product.name}<span className="mt-0.5 block text-[10px] text-stocky-text-sub">{product.barcode || product.categoryName || 'No barcode'}</span></span>
                <span className="text-[10px] text-stocky-primary">Add</span>
              </button>) : <p className="px-2 py-3 text-[11px] text-stocky-text-sub">{productSearch.trim() ? 'No matching products.' : 'All products are selected.'}</p>}
            </div>}
          </div>
          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
            {selectedProducts.length > 0 ? selectedProducts.map((product) => <div key={product.id} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"><span className="flex h-6 w-6 items-center justify-center rounded-full stocky-status-info"><CheckCircleIcon size="xs" /></span><span className="min-w-0 flex-1 truncate text-xs text-stocky-text-main">{product.name}</span><span className="text-[10px] text-stocky-text-sub">{product.barcode || 'No barcode'}</span><button type="button" onClick={() => setAssignedProductIds((current) => current.filter((id) => id !== product.id))} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global" aria-label={`Remove ${product.name}`}><XIcon size="xs" /></button></div>) : <p className="py-2 text-[11px] text-stocky-text-sub">Search and select at least one product for this task.</p>}
          </div>
        </div>

        <label className="block text-xs font-medium text-stocky-text-main">Note <span className="font-normal text-stocky-text-sub">(optional)</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Example: Check the back shelf before closing" className="mt-1.5 w-full resize-none rounded-xl border border-stocky-border-subtle px-3 py-2 text-sm focus:border-stocky-primary focus:outline-none" />
        </label>
        {error && <p className="rounded-xl stocky-status-critical border px-3 py-2 text-xs">{error}</p>}
      </form>
      <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
        <button type="button" onClick={onClose} className="h-10 flex-1 rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-main">Cancel</button>
        <button type="submit" form="stock-task-assignment-form" disabled={saving || assignees.length === 0} className="h-10 flex-1 rounded-full bg-stocky-primary text-xs font-medium text-white disabled:opacity-60">{saving ? 'Creating task...' : 'Assign task'}</button>
      </div>
    </SideDrawer>
  );
}
