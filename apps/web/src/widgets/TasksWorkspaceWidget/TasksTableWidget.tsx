'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  ListTodoIcon,
  PlusIcon,
  WarehouseIcon,
} from '@stocky/icons';
import type {
  CompanyUserRole,
  Location,
  Product,
  StockTask,
  StockTaskItem,
} from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTranslation } from '@/lib/i18n';

type TeamMember = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: CompanyUserRole;
  status?: string;
};

export interface TasksTableWidgetProps {
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  products: Product[];
  locations: Location[];
  members: TeamMember[];
  userRole: CompanyUserRole;
  currentUserId?: string | null;
  searchQuery: string;
  activeQueue?: 'ongoing' | 'completed';
  canAssignTask: boolean;
  onAssignTask: () => void;
  onOpenRunner: (task: StockTask) => void;
  onOpenReview: (task: StockTask) => void;
  onOpenDetails: (task: StockTask) => void;
}

function taskTypeLabel(taskType: StockTask['taskType'], t: (key: string) => string) {
  if (taskType === 'open') return t('tasks.openTask') || 'Open task';
  return taskType === 'count'
    ? (t('tasks.countQuantities') || 'Count quantities')
    : (t('tasks.checkExpiry') || 'Check expiry dates');
}

function getStatusBadge(status: StockTask['status'], t: (key: string) => string) {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-info">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {t('tasks.statusSubmitted') || 'In review'}
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {t('tasks.statusInProgress') || 'In progress'}
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-critical">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {t('tasks.statusRejected') || 'Needs correction'}
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-success">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {t('tasks.statusApproved') || 'Approved'}
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {t('tasks.statusCancelled') || 'Cancelled'}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-muted capitalize">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {t('tasks.statusAssigned') || 'Assigned'}
        </span>
      );
  }
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not recorded';
}

export function TasksTableWidget({
  tasks,
  taskItems,
  locations,
  members,
  userRole,
  currentUserId,
  searchQuery,
  canAssignTask,
  onAssignTask,
  onOpenRunner,
  onOpenReview,
  onOpenDetails,
}: TasksTableWidgetProps) {
  const { t, isRtl } = useTranslation();
  const locationMap = React.useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );
  const memberMap = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const handleTaskClick = (task: StockTask) => {
    const canRun =
      task.assignedToCompanyUserId === currentUserId &&
      ['assigned', 'in_progress', 'rejected'].includes(task.status);
    if (canRun) {
      onOpenRunner(task);
      return;
    }
    const canReview = userRole !== 'staff' && task.status === 'submitted';
    if (canReview) {
      onOpenReview(task);
      return;
    }
    onOpenDetails(task);
  };

  // Empty State: No tasks matching current filters
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stocky-bg-global text-stocky-text-sub">
          <WarehouseIcon size="md" />
        </div>
        <h3 className="mt-3 text-sm font-medium text-stocky-text-main">
          {searchQuery.trim()
            ? (t('common.noResults') || 'No tasks found matching your search.')
            : (t('tasks.noTasksFound') || 'No tasks found.')}
        </h3>
        <p className="mt-1 max-w-sm text-xs text-stocky-text-sub">
          {searchQuery.trim()
            ? 'Try searching with different keywords or reset your filter settings.'
            : (t('tasks.subtitle') || 'Assign blind stock counts, expiry audits, and operational duties to team members.')}
        </p>
        {canAssignTask && !searchQuery.trim() && (
          <button
            type="button"
            onClick={onAssignTask}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-4 text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>{t('tasks.assignTask') || 'Assign task'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Desktop Table View (Hidden on mobile) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-start text-xs border-collapse">
          <thead>
            <tr className="h-11 border-b border-stocky-border-subtle bg-stocky-bg-global/40 text-[10px] uppercase tracking-wider text-stocky-text-sub whitespace-nowrap select-none">
              <th className="w-[28%] px-4 py-3 font-semibold text-start">{t('tasks.title') || 'Task'}</th>
              <th className="hidden md:table-cell w-[14%] px-3 py-3 font-semibold text-start">
                {t('common.type') || 'Type'}
              </th>
              <th className="hidden sm:table-cell w-[14%] px-3 py-3 font-semibold text-start">
                {t('common.location') || 'Location'}
              </th>
              <th className="hidden lg:table-cell w-[16%] px-3 py-3 font-semibold text-start">
                {t('tasks.assignTo') || 'Assigned to'}
              </th>
              <th className="w-[10%] px-3 py-3 font-semibold text-start">{t('common.items') || 'Items'}</th>
              <th className="w-[14%] min-w-[100px] px-3 py-3 font-semibold text-start">{t('common.status') || 'Status'}</th>
              <th className="w-[14%] min-w-[110px] px-4 py-3 text-end font-semibold">{t('common.actions') || 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stocky-border-subtle">
            {tasks.map((task) => {
              const items = taskItems.filter((item) => item.taskId === task.id);
              const completed = items.filter((item) => item.status !== 'pending').length;
              const assignee = memberMap.get(task.assignedToCompanyUserId);
              const canRun =
                task.assignedToCompanyUserId === currentUserId &&
                ['assigned', 'in_progress', 'rejected'].includes(task.status);
              const canReview = userRole !== 'staff' && task.status === 'submitted';

              return (
                <tr
                  key={task.id}
                  tabIndex={0}
                  onClick={() => handleTaskClick(task)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleTaskClick(task);
                    }
                  }}
                  className="group align-middle cursor-pointer hover:bg-stocky-bg-global/50 focus:bg-stocky-bg-global/50 focus:outline-none transition-colors"
                >
                  {/* Task Title & Icon */}
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                          task.taskType === 'count'
                            ? 'stocky-status-info'
                            : task.taskType === 'expiry'
                            ? 'stocky-status-warning'
                            : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}
                      >
                        {task.taskType === 'count' ? (
                          <CheckCircleIcon size="xs" />
                        ) : task.taskType === 'expiry' ? (
                          <ClockIcon size="xs" />
                        ) : (
                          <ListTodoIcon size="xs" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stocky-text-main text-xs group-hover:text-stocky-primary transition-colors">
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-stocky-text-sub sm:hidden">
                          {taskTypeLabel(task.taskType, t)} · {locationMap.get(task.locationId) || 'Location'}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-stocky-text-sub">
                          {formatDate(task.createdAt)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Task Type */}
                  <td className="hidden md:table-cell px-3 py-3.5 text-xs text-stocky-text-sub">
                    <span className="inline-flex items-center gap-1.5">
                      {task.taskType === 'count' ? (
                        <CheckCircleIcon size="xs" className="text-stocky-text-sub shrink-0" />
                      ) : task.taskType === 'expiry' ? (
                        <ClockIcon size="xs" className="text-stocky-text-sub shrink-0" />
                      ) : (
                        <ListTodoIcon size="xs" className="text-stocky-text-sub shrink-0" />
                      )}
                      <span>{taskTypeLabel(task.taskType, t)}</span>
                    </span>
                  </td>

                  {/* Location */}
                  <td className="hidden sm:table-cell px-3 py-3.5 text-xs text-stocky-text-sub truncate">
                    {locationMap.get(task.locationId) || 'Location'}
                  </td>

                  {/* Assigned to */}
                  <td className="hidden lg:table-cell px-3 py-3.5 text-xs text-stocky-text-sub">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar
                        src={assignee?.avatar_url}
                        name={assignee?.full_name}
                        email={assignee?.email}
                        size="xs"
                        className="h-6 w-6 shrink-0"
                      />
                      <span className="truncate text-stocky-text-main text-xs">
                        {assignee?.full_name || assignee?.email || 'Unassigned'}
                      </span>
                    </div>
                  </td>

                  {/* Items progress */}
                  <td className="px-3 py-3.5 text-xs text-stocky-text-main">
                    {task.taskType === 'open' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-sub">
                        {t('tasks.directTask') || 'Direct task'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-main">
                        {completed}/{items.length}
                      </span>
                    )}
                  </td>

                  {/* Status Pill */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {getStatusBadge(task.status, t)}
                  </td>

                  {/* Action Button */}
                  <td className="px-4 py-3.5 text-end whitespace-nowrap">
                    <div className="flex justify-end">
                      {canRun && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenRunner(task);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-3 text-xs font-medium text-white transition-colors cursor-pointer"
                        >
                          <span>
                            {task.status === 'assigned'
                              ? (t('attendance.clockIn') ? 'Start' : 'Start')
                              : task.status === 'rejected'
                              ? (t('tasks.statusRejected') ? 'Correct' : 'Correct')
                              : 'Continue'}
                          </span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      )}

                      {canReview && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenReview(task);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-3 text-xs font-medium text-white transition-colors cursor-pointer"
                        >
                          <span>{t('common.review') || 'Review'}</span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      )}

                      {!canRun && !canReview && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails(task);
                          }}
                          className="inline-flex h-8 items-center gap-1 rounded-full border border-stocky-border-subtle hover:border-stocky-primary/40 px-3 text-xs font-medium text-stocky-text-main hover:text-stocky-primary transition-colors cursor-pointer"
                        >
                          <span>{t('common.view') || 'View'}</span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Card List (Visible only on mobile phone) */}
      <div className="sm:hidden divide-y divide-stocky-border-subtle">
        {tasks.map((task) => {
          const items = taskItems.filter((item) => item.taskId === task.id);
          const completed = items.filter((item) => item.status !== 'pending').length;
          const assignee = memberMap.get(task.assignedToCompanyUserId);
          const locationName = locationMap.get(task.locationId) || 'Main Branch';
          const isCount = task.taskType === 'count';
          const isExpiry = task.taskType === 'expiry';

          return (
            <article
              key={task.id}
              role="button"
              tabIndex={0}
              onClick={() => handleTaskClick(task)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleTaskClick(task);
                }
              }}
              className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/60 transition-colors cursor-pointer text-start"
            >
              {/* Left Anchor + Center Info Stack */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    isCount
                      ? 'stocky-status-info bg-emerald-50 text-emerald-600 border-emerald-200'
                      : isExpiry
                      ? 'stocky-status-warning bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  {isCount ? (
                    <CheckCircleIcon size="xs" />
                  ) : isExpiry ? (
                    <ClockIcon size="xs" />
                  ) : (
                    <ListTodoIcon size="xs" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-stocky-text-main leading-tight truncate">
                    {task.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                    <span className="truncate max-w-[110px]">{locationName}</span>
                    <span>·</span>
                    <span className="truncate max-w-[100px]">{assignee?.full_name?.split(' ')[0] || assignee?.email?.split('@')[0] || 'Unassigned'}</span>
                    <span>·</span>
                    <span className="font-medium text-stocky-text-main">
                      {task.taskType === 'open'
                        ? (t('tasks.directTask') || 'Direct task')
                        : `${completed}/${items.length} ${t('tasks.itemsCount') || 'items'}`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right Status & Date Stack */}
              <div className="shrink-0 flex flex-col items-end gap-0.5">
                {getStatusBadge(task.status, t)}
                <span className="text-[10px] text-stocky-text-sub font-normal mt-0.5">
                  {formatDate(task.createdAt)}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* Table Footer / Counter */}
      <div className="flex items-center justify-between border-t border-stocky-border-subtle px-4 py-3 text-xs text-stocky-text-sub bg-white rounded-b-2xl">
        <span>{t('common.showing')} {tasks.length} {t('tasks.title')}</span>
      </div>
    </div>
  );
}
