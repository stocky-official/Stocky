'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircleIcon, ChevronDownIcon, ClockIcon, ListTodoIcon, SearchIcon, XIcon } from '@stocky/icons';
import type { CompanyUserRole, CreateStockTaskCommand, Location, Product, StockTaskType } from '@stocky/types';
import { SideDrawer } from '@/components/ui/SideDrawer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const [taskType, setTaskType] = useState<StockTaskType>(initialTaskType);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
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
    const candidates = members.filter((member) => allowedRoles.includes(member.role) && member.status === 'active');
    if (!locationId) return candidates;
    const location = locations.find((candidate) => candidate.id === locationId);
    const assignedIds = new Set(assignments.filter((assignment) => assignment.location_id === locationId).map((assignment) => assignment.user_id));
    return candidates.filter((member) => assignedIds.has(member.id) || member.id === location?.managerUserId);
  }, [assignments, locationId, locations, members, userRole]);

  useEffect(() => {
    if (!isOpen) return;
    setTaskType(initialTaskType);
    setTaskTitle('');
    setTaskDetails('');
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
    if (!locationId) return setError(t('tasks.chooseLocation'));
    if (!assigneeId) return setError(t('tasks.chooseAssignee'));

    if (taskType === 'open') {
      if (!taskTitle.trim()) return setError(t('tasks.taskTitlePlaceholder'));
      if (!taskDetails.trim()) return setError(t('tasks.taskDetailsPlaceholder'));
    } else {
      if (assignedProductIds.length === 0) return setError(t('tasks.errorSelectProduct'));
    }

    if (scheduleEnabled && (!scheduledStartAt || !scheduledEndAt)) {
      return setError(t('tasks.errorWorkWindow'));
    }
    if (scheduleEnabled && new Date(scheduledEndAt).getTime() <= new Date(scheduledStartAt).getTime()) {
      return setError(t('tasks.errorEndTimeAfterStart'));
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate({
        locationId,
        taskType,
        assignedToCompanyUserId: assigneeId,
        productIds: taskType === 'open' ? [] : assignedProductIds,
        title: taskType === 'open' ? taskTitle.trim() : undefined,
        note: taskType === 'open' ? taskDetails.trim() : (note.trim() || null),
        scheduledStartAt: scheduleEnabled ? new Date(scheduledStartAt).toISOString() : null,
        scheduledEndAt: scheduleEnabled ? new Date(scheduledEndAt).toISOString() : null,
      });
      onClose();
    } catch (createError: any) {
      setError(createError?.message || t('tasks.errorCreateTask'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SideDrawer isOpen={isOpen} onClose={onClose} ariaLabel={t('tasks.assignTask')} zIndex={70}>
      <div className="flex items-start justify-between gap-4 border-b border-stocky-border-subtle px-5 py-4">
        <div>
          <h2 className="text-lg font-medium text-stocky-text-main">{t('tasks.assignTask')}</h2>
          <p className="mt-1 text-xs text-stocky-text-sub">
            {taskType === 'open'
              ? t('tasks.openTaskDesc')
              : t('tasks.subtitleNotice')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global transition-colors"
          aria-label={t('common.close')}
        >
          <XIcon size="xs" />
        </button>
      </div>

      <form id="stock-task-assignment-form" onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Task Type Switcher: 3 Options */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => { setTaskType('count'); setError(null); }}
            className={`stocky-task-type-option rounded-2xl flex items-center gap-2.5 border p-3 text-start transition-colors ${
              taskType === 'count'
                ? 'border-stocky-primary bg-stocky-primary/5 ring-1 ring-stocky-primary'
                : 'border-stocky-border-subtle hover:bg-stocky-bg-global/50'
            }`}
          >
            <CheckCircleIcon size="xs" className={taskType === 'count' ? 'text-stocky-primary shrink-0' : 'text-stocky-text-sub shrink-0'} />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-stocky-text-main">{t('tasks.countQuantities')}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-stocky-text-sub truncate">{t('tasks.countDesc')}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTaskType('expiry'); setError(null); }}
            className={`stocky-task-type-option rounded-2xl flex items-center gap-2.5 border p-3 text-start transition-colors ${
              taskType === 'expiry'
                ? 'border-stocky-primary bg-stocky-primary/5 ring-1 ring-stocky-primary'
                : 'border-stocky-border-subtle hover:bg-stocky-bg-global/50'
            }`}
          >
            <ClockIcon size="xs" className={taskType === 'expiry' ? 'text-stocky-primary shrink-0' : 'text-stocky-text-sub shrink-0'} />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-stocky-text-main">{t('tasks.checkExpiry')}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-stocky-text-sub truncate">{t('tasks.expiryDesc')}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setTaskType('open'); setError(null); }}
            className={`stocky-task-type-option rounded-2xl flex items-center gap-2.5 border p-3 text-start transition-colors ${
              taskType === 'open'
                ? 'border-stocky-primary bg-stocky-primary/5 ring-1 ring-stocky-primary'
                : 'border-stocky-border-subtle hover:bg-stocky-bg-global/50'
            }`}
          >
            <ListTodoIcon size="xs" className={taskType === 'open' ? 'text-stocky-primary shrink-0' : 'text-stocky-text-sub shrink-0'} />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-stocky-text-main">{t('tasks.openTask')}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-stocky-text-sub truncate">{t('tasks.openTaskDesc')}</span>
            </span>
          </button>
        </div>

        {/* If Open Task: Custom Title & Instructions */}
        {taskType === 'open' ? (
          <div className="space-y-4 rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/40 p-4">
            <div>
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('tasks.taskTitle')} <span className="text-stocky-primary">*</span>
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(event) => { setTaskTitle(event.target.value); setError(null); }}
                placeholder={t('tasks.taskTitlePlaceholder')}
                className="mt-1.5 h-10 w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stocky-text-main">
                {t('tasks.taskDetails')} <span className="text-stocky-primary">*</span>
              </label>
              <textarea
                value={taskDetails}
                onChange={(event) => { setTaskDetails(event.target.value); setError(null); }}
                rows={4}
                placeholder={t('tasks.taskDetailsPlaceholder')}
                className="mt-1.5 w-full resize-none rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget px-3 py-2 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none"
              />
            </div>
          </div>
        ) : null}

        {/* Location Selector */}
        <div className="relative">
          <p className="text-xs font-medium text-stocky-text-main">{t('common.location')}</p>
          <button
            type="button"
            onClick={() => setLocationMenuOpen((current) => !current)}
            aria-haspopup="listbox"
            aria-expanded={locationMenuOpen}
            className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-xl border border-stocky-border-subtle px-3 text-start text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none"
          >
            <span className="min-w-0 flex-1 truncate">{selectedLocation?.name || t('tasks.chooseLocation')}</span>
            {selectedLocation && <span className="text-[10px] capitalize text-stocky-text-sub">{selectedLocation.type === 'warehouse' ? t('drawers.receiveStock.warehouse') : t('drawers.receiveStock.branch')}</span>}
            <ChevronDownIcon size="xs" className="shrink-0 text-stocky-text-sub" />
          </button>
          {locationMenuOpen && (
            <div role="listbox" className="stocky-account-menu stocky-dropdown-panel absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-1 shadow-lg">
              <button
                type="button"
                role="option"
                aria-selected={!locationId}
                onClick={() => { setLocationId(''); setLocationMenuOpen(false); }}
                className={`stocky-dropdown-item w-full justify-between rounded-lg px-2 py-2 text-start text-xs ${!locationId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}
              >
                {t('tasks.chooseLocation')}
              </button>
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  role="option"
                  aria-selected={location.id === locationId}
                  onClick={() => { setLocationId(location.id); setLocationMenuOpen(false); }}
                  className={`stocky-dropdown-item w-full justify-between rounded-lg px-2 py-2 text-start text-xs ${location.id === locationId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}
                >
                  <span>{location.name}</span>
                  <span className="text-[10px] capitalize text-stocky-text-sub">{location.type === 'warehouse' ? t('drawers.receiveStock.warehouse') : t('drawers.receiveStock.branch')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee Selector */}
        <div className="relative">
          <p className="text-xs font-medium text-stocky-text-main">{t('tasks.assignTo')}</p>
          <button
            type="button"
            onClick={() => setAssigneeMenuOpen((current) => !current)}
            disabled={assignees.length === 0}
            aria-haspopup="listbox"
            aria-expanded={assigneeMenuOpen}
            className="mt-1.5 flex h-10 w-full items-center gap-2 rounded-xl border border-stocky-border-subtle px-3 text-start text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none disabled:opacity-60"
          >
            {selectedAssignee ? memberAvatar(selectedAssignee, 'h-6 w-6') : <span className="h-6 w-6 rounded-full bg-stocky-bg-global" />}
            <span className="min-w-0 flex-1 truncate">
              {selectedAssignee ? `${selectedAssignee.full_name || selectedAssignee.email} · ${selectedAssignee.role === 'manager' ? t('tasks.managerRole') : t('tasks.staffRole')}` : t('tasks.chooseAssignee')}
            </span>
            <ChevronDownIcon size="xs" className="shrink-0 text-stocky-text-sub" />
          </button>
          {assigneeMenuOpen && assignees.length > 0 && (
            <div role="listbox" className="stocky-account-menu stocky-dropdown-panel absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-stocky-border-subtle bg-stocky-bg-widget p-1 shadow-lg">
              {assignees.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected={member.id === assigneeId}
                  onClick={() => { setAssigneeId(member.id); setAssigneeMenuOpen(false); }}
                  className={`stocky-dropdown-item w-full gap-2 rounded-lg px-2 py-2 text-start text-xs ${member.id === assigneeId ? 'bg-stocky-primary/5 text-stocky-primary' : 'text-stocky-text-main hover:bg-stocky-bg-global'}`}
                >
                  {memberAvatar(member, 'h-7 w-7')}
                  <span className="min-w-0 flex-1 truncate">
                    {member.full_name || member.email}
                    <span className="mt-0.5 block text-[10px] text-stocky-text-sub">{member.role === 'manager' ? t('tasks.managerRole') : t('tasks.staffRole')}</span>
                  </span>
                  {member.id === assigneeId && <CheckCircleIcon size="xs" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {assignees.length === 0 && (
          <p className="rounded-xl stocky-status-warning border px-3 py-2 text-xs">
            {t('tasks.noAssigneesWarning')}
          </p>
        )}

        {/* Schedule / Timeframe Box */}
        <div className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/60 p-3">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(event) => { setScheduleEnabled(event.target.checked); setError(null); }}
              className="mt-0.5 h-3.5 w-3.5 accent-stocky-primary"
            />
            <span>
              <span className="block text-xs font-medium text-stocky-text-main">{t('tasks.workTimeframe')}</span>
              <span className="mt-0.5 block text-[10px] text-stocky-text-sub">
                {t('tasks.workTimeframeDesc')}
              </span>
            </span>
          </label>
          {scheduleEnabled && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <label className="text-[11px] font-medium text-stocky-text-main">
                {t('tasks.starts')}
                <input
                  type="datetime-local"
                  value={scheduledStartAt}
                  onChange={(event) => setScheduledStartAt(event.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget px-2 text-xs focus:border-stocky-primary focus:outline-none"
                />
              </label>
              <label className="text-[11px] font-medium text-stocky-text-main">
                {t('tasks.ends')}
                <input
                  type="datetime-local"
                  value={scheduledEndAt}
                  onChange={(event) => setScheduledEndAt(event.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget px-2 text-xs focus:border-stocky-primary focus:outline-none"
                />
              </label>
            </div>
          )}
        </div>

        {/* Products Selector: Only for Count & Expiry tasks */}
        {taskType !== 'open' && (
          <div className="rounded-xl border border-stocky-border-subtle bg-stocky-bg-global/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-stocky-text-main">{t('tasks.productsToCheck')}</p>
              <span className="rounded-full stocky-status-info border px-2 py-1 text-[11px]">{selectedProducts.length}</span>
            </div>
            <div className="relative mt-2">
              <SearchIcon size="xs" className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub" />
              <input
                value={productSearch}
                onChange={(event) => { setProductSearch(event.target.value); setProductMenuOpen(true); }}
                onFocus={() => setProductMenuOpen(true)}
                placeholder={t('tasks.searchProducts')}
                className="h-9 w-full rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget ps-8 pe-3 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none"
                aria-label={t('tasks.searchProducts')}
              />
              {productMenuOpen && (
                <div className="stocky-dropdown-panel absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-stocky-border-subtle bg-stocky-bg-widget p-1 shadow-lg">
                  {availableProducts.length > 0 ? (
                    availableProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => { setAssignedProductIds((current) => [...current, product.id]); setProductSearch(''); setProductMenuOpen(true); setError(null); }}
                        className="stocky-dropdown-item flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-xs text-stocky-text-main hover:bg-stocky-bg-global"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {product.name}
                          <span className="mt-0.5 block text-[10px] text-stocky-text-sub">{product.barcode || product.categoryName || t('drawers.receiveStock.noBarcode')}</span>
                        </span>
                        <span className="text-[10px] text-stocky-primary font-medium">{t('common.add')}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-2 py-3 text-[11px] text-stocky-text-sub">
                      {productSearch.trim() ? t('common.noResults') : t('tasks.allProductsSelected')}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto">
              {selectedProducts.length > 0 ? (
                selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-2 rounded-lg bg-stocky-bg-widget px-2.5 py-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full stocky-status-info">
                      <CheckCircleIcon size="xs" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-stocky-text-main">{product.name}</span>
                    <span className="text-[10px] text-stocky-text-sub">{product.barcode || t('drawers.receiveStock.noBarcode')}</span>
                    <button
                      type="button"
                      onClick={() => setAssignedProductIds((current) => current.filter((id) => id !== product.id))}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global"
                      aria-label={`${t('common.remove')} ${product.name}`}
                    >
                      <XIcon size="xs" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="py-2 text-[11px] text-stocky-text-sub">
                  {t('tasks.searchProductPrompt')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Optional Note for count/expiry */}
        {taskType !== 'open' && (
          <label className="block text-xs font-medium text-stocky-text-main">
            {t('common.notes')} <span className="font-normal text-stocky-text-sub">({t('common.optional')})</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder={t('tasks.optionalNotesDesc')}
              className="mt-1.5 w-full resize-none rounded-xl border border-stocky-border-subtle px-3 py-2 text-xs focus:border-stocky-primary focus:outline-none"
            />
          </label>
        )}

        {error && <p className="rounded-xl stocky-status-critical border px-3 py-2 text-xs">{error}</p>}
      </form>

      <div className="flex gap-2 border-t border-stocky-border-subtle p-5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 flex-1 rounded-full border border-stocky-border-subtle text-xs font-medium text-stocky-text-main hover:bg-stocky-bg-global transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          form="stock-task-assignment-form"
          disabled={saving || assignees.length === 0}
          className="h-10 flex-1 rounded-full bg-stocky-primary text-xs font-medium text-stocky-text-inverse hover:bg-stocky-primary-hover transition-colors disabled:opacity-60"
        >
          {saving ? t('tasks.creatingTask') : t('tasks.assignTask')}
        </button>
      </div>
    </SideDrawer>
  );
}
