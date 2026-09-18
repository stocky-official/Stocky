'use client';

import React, { useEffect, useRef } from 'react';
import { CheckCircleIcon, ClockIcon, ListTodoIcon, RotateCcwIcon, XIcon } from '@stocky/icons';
import type { Location, StockTask } from '@stocky/types';
import { useTranslation } from '@/lib/i18n';

export interface TasksFilterState {
  taskType: 'all' | 'count' | 'expiry' | 'open';
  locationId: string;
  assigneeId: string;
  status: StockTask['status'] | 'all';
}

export interface TasksFilterPanelWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: TasksFilterState;
  onFilterChange: (filters: TasksFilterState) => void;
  onResetFilters: () => void;
  matchingCount: number;
  totalCount: number;
  locations: Location[];
  members: Array<{ id: string; email: string; full_name?: string | null }>;
  className?: string;
  isMobile?: boolean;
}

export function TasksFilterPanelWidget({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  matchingCount,
  totalCount,
  locations,
  members,
  className,
  isMobile = false,
}: TasksFilterPanelWidgetProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={
        className ||
        (isMobile
          ? "flex flex-col min-h-0 bg-white"
          : "stocky-filter-panel rounded-2xl border border-stocky-border-subtle bg-white p-4 shadow-bevel-float sm:p-5")
      }
    >
      {/* Header (Desktop only) */}
      {!isMobile && (
        <div className="flex items-center justify-between border-b border-stocky-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stocky-text-sub">
              {t('common.filter') || 'Filter'}
            </span>
            <span className="rounded-full bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-main">
              {matchingCount} of {totalCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-stocky-text-sub hover:bg-stocky-bg-global hover:text-stocky-text-main transition-colors cursor-pointer"
            aria-label={t('common.close') || 'Close filters'}
          >
            <XIcon size="xs" />
          </button>
        </div>
      )}

      {/* Filter Options Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Task Type */}
        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1.5">
            {t('common.type') || 'Task Type'}
          </label>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, taskType: 'all' })}
              className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                filters.taskType === 'all'
                  ? 'bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'text-stocky-text-main hover:bg-stocky-bg-global'
              }`}
            >
              <span>{t('inventory.allCategories') || 'All types'}</span>
              {filters.taskType === 'all' && <CheckCircleIcon size="xs" />}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, taskType: 'count' })}
              className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                filters.taskType === 'count'
                  ? 'bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'text-stocky-text-main hover:bg-stocky-bg-global'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon size="xs" className="text-stocky-text-sub shrink-0" />
                {t('tasks.countQuantities') || 'Count quantities'}
              </span>
              {filters.taskType === 'count' && <CheckCircleIcon size="xs" />}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, taskType: 'expiry' })}
              className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                filters.taskType === 'expiry'
                  ? 'bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'text-stocky-text-main hover:bg-stocky-bg-global'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ClockIcon size="xs" className="text-stocky-text-sub shrink-0" />
                {t('tasks.checkExpiry') || 'Check expiry dates'}
              </span>
              {filters.taskType === 'expiry' && <CheckCircleIcon size="xs" />}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, taskType: 'open' })}
              className={`flex h-8 items-center justify-between rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                filters.taskType === 'open'
                  ? 'bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'text-stocky-text-main hover:bg-stocky-bg-global'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ListTodoIcon size="xs" className="text-stocky-text-sub shrink-0" />
                {t('tasks.openTask') || 'Open task'}
              </span>
              {filters.taskType === 'open' && <CheckCircleIcon size="xs" />}
            </button>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1.5">
            Location
          </label>
          <select
            value={filters.locationId}
            onChange={(e) => onFilterChange({ ...filters, locationId: e.target.value })}
            className="w-full h-9 rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
          >
            <option value="all">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.type})
              </option>
            ))}
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1.5">
            Assigned to
          </label>
          <select
            value={filters.assigneeId}
            onChange={(e) => onFilterChange({ ...filters, assigneeId: e.target.value })}
            className="w-full h-9 rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
          >
            <option value="all">All team members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || member.email}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[11px] font-medium text-stocky-text-sub mb-1.5">
            {t('common.status') || 'Status'}
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as any })}
            className="w-full h-9 rounded-xl border border-stocky-border-subtle bg-white px-3 text-xs text-stocky-text-main capitalize focus:border-stocky-primary focus:outline-none transition-colors"
          >
            <option value="all">{t('inventory.allStatuses') || 'All statuses'}</option>
            <option value="assigned">{t('tasks.statusAssigned') || 'Assigned'}</option>
            <option value="in_progress">{t('tasks.statusInProgress') || 'In progress'}</option>
            <option value="submitted">{t('tasks.statusSubmitted') || 'In review'}</option>
            <option value="rejected">{t('tasks.statusRejected') || 'Needs correction'}</option>
            <option value="approved">{t('tasks.statusApproved') || 'Approved'}</option>
            <option value="cancelled">{t('tasks.statusCancelled') || 'Cancelled'}</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-stocky-border-subtle pt-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-medium text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
        >
          <RotateCcwIcon size="xs" />
          <span>{t('inventory.resetFilters') || 'Reset all'}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="h-9 px-5 rounded-full bg-stocky-text-main text-xs font-medium text-white hover:bg-black transition-colors cursor-pointer"
        >
          {t('common.done') || 'Done'}
        </button>
      </div>
    </div>
  );
}
