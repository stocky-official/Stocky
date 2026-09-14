'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
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

function taskTypeLabel(taskType: StockTask['taskType']) {
  return taskType === 'count' ? 'Count quantities' : 'Check expiry dates';
}

function statusLabel(status: StockTask['status']) {
  return status.replace('_', ' ');
}

function getStatusBadge(status: StockTask['status']) {
  switch (status) {
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-info">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          In review
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-warning">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          In progress
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-critical">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Needs correction
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-success">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Approved
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium stocky-status-muted capitalize">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {status.replace('_', ' ')}
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
    if (task.status === 'submitted' && userRole !== 'staff') {
      onOpenReview(task);
      return;
    }
    onOpenDetails(task);
  };

  if (tasks.length === 0) {
    return (
      <div className="px-5 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stocky-bg-global text-stocky-text-sub">
          <CheckCircleIcon size="md" />
        </div>
        <h3 className="mt-3 text-sm font-medium text-stocky-text-main">
          {searchQuery ? 'No matching tasks' : 'No tasks found'}
        </h3>
        <p className="mt-1 max-w-sm mx-auto text-xs text-stocky-text-sub">
          {searchQuery
            ? 'Try another search term or reset your filters.'
            : 'Assign a count or expiry check to a team member to get started.'}
        </p>
        {!searchQuery && canAssignTask && (
          <button
            type="button"
            onClick={onAssignTask}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>Assign task</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 1. Desktop Table View (Hidden on mobile) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed text-left text-xs border-collapse">
          <thead>
            <tr className="h-11 border-b border-stocky-border-subtle bg-stocky-bg-global/40 text-[10px] uppercase tracking-wider text-stocky-text-sub whitespace-nowrap select-none">
              <th className="w-[28%] px-4 py-3 font-semibold">Task</th>
              <th className="hidden md:table-cell w-[14%] px-3 py-3 font-semibold">
                Type
              </th>
              <th className="hidden sm:table-cell w-[14%] px-3 py-3 font-semibold">
                Location
              </th>
              <th className="hidden lg:table-cell w-[16%] px-3 py-3 font-semibold">
                Assigned to
              </th>
              <th className="w-[10%] px-3 py-3 font-semibold">Items</th>
              <th className="w-[14%] min-w-[100px] px-3 py-3 font-semibold">Status</th>
              <th className="w-[14%] min-w-[110px] px-4 py-3 text-right font-semibold">Action</th>
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
                            : 'stocky-status-warning'
                        }`}
                      >
                        {task.taskType === 'count' ? (
                          <CheckCircleIcon size="xs" />
                        ) : (
                          <ClockIcon size="xs" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stocky-text-main text-xs group-hover:text-stocky-primary transition-colors">
                          {task.title}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-stocky-text-sub sm:hidden">
                          {taskTypeLabel(task.taskType)} · {locationMap.get(task.locationId) || 'Location'}
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
                        <CheckCircleIcon size="xs" className="text-stocky-text-sub" />
                      ) : (
                        <ClockIcon size="xs" className="text-stocky-text-sub" />
                      )}
                      <span>{taskTypeLabel(task.taskType)}</span>
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-stocky-bg-global px-2 py-0.5 text-[11px] font-medium text-stocky-text-main">
                      {completed}/{items.length}
                    </span>
                  </td>

                  {/* Status Pill */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    {getStatusBadge(task.status)}
                  </td>

                  {/* Action Button */}
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
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
                              ? 'Start'
                              : task.status === 'rejected'
                              ? 'Correct'
                              : 'Continue'}
                          </span>
                          <ChevronRightIcon size="xs" />
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
                          <span>Review</span>
                          <ChevronRightIcon size="xs" />
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
                          <span>View</span>
                          <ChevronRightIcon size="xs" />
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
          const canRun =
            task.assignedToCompanyUserId === currentUserId &&
            ['assigned', 'in_progress', 'rejected'].includes(task.status);
          const canReview = userRole !== 'staff' && task.status === 'submitted';
          const locationName = locationMap.get(task.locationId) || 'Main Branch';
          const isCount = task.taskType === 'count';

          return (
            <article
              key={task.id}
              tabIndex={0}
              onClick={() => handleTaskClick(task)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleTaskClick(task);
                }
              }}
              className="p-3.5 flex flex-col gap-2.5 bg-white hover:bg-stocky-bg-global/30 active:bg-stocky-bg-global/60 transition-all cursor-pointer"
            >
              {/* Row 1: Type Icon + Title & Date + Status Badge */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${
                      isCount
                        ? 'stocky-status-info bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'stocky-status-warning bg-amber-50 text-amber-600 border-amber-200'
                    }`}
                  >
                    {isCount ? (
                      <CheckCircleIcon size="xs" />
                    ) : (
                      <ClockIcon size="xs" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-stocky-text-main leading-snug truncate">
                      {task.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-stocky-text-sub flex items-center gap-1.5 truncate">
                      <span>{taskTypeLabel(task.taskType)}</span>
                      <span>·</span>
                      <span>{formatDate(task.createdAt)}</span>
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(task.status)}
                </div>
              </div>

              {/* Row 2: Location & Progress Summary Box */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stocky-bg-global/50 border border-stocky-border-subtle/70 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <WarehouseIcon size="xs" className="text-stocky-text-sub shrink-0" />
                  <span className="text-[11px] font-medium text-stocky-text-main truncate">
                    {locationName}
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="text-[10px] text-stocky-text-sub">Counted:</span>
                  <span className="inline-flex items-center rounded-full bg-white border border-stocky-border-subtle px-2 py-0.5 text-[10px] font-semibold text-stocky-text-main shadow-2xs">
                    {completed}/{items.length} items
                  </span>
                </div>
              </div>

              {/* Row 3: Assignee + Action Button */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar
                    src={assignee?.avatar_url}
                    name={assignee?.full_name}
                    email={assignee?.email}
                    size="xs"
                    className="h-6 w-6 shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-stocky-text-main truncate block">
                      {assignee?.full_name || assignee?.email?.split('@')[0] || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {canRun && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenRunner(task);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-3 text-xs font-semibold text-white transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span>
                        {task.status === 'assigned'
                          ? 'Start'
                          : task.status === 'rejected'
                          ? 'Correct'
                          : 'Continue'}
                      </span>
                      <ChevronRightIcon size="xs" />
                    </button>
                  )}

                  {canReview && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenReview(task);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-full bg-stocky-primary hover:bg-stocky-primary-hover px-3 text-xs font-semibold text-white transition-colors cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <span>Review</span>
                      <ChevronRightIcon size="xs" />
                    </button>
                  )}

                  {!canRun && !canReview && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenDetails(task);
                      }}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-stocky-border-subtle hover:border-stocky-primary/40 bg-stocky-bg-widget px-3 text-xs font-medium text-stocky-text-main hover:text-stocky-primary transition-colors cursor-pointer active:scale-95"
                    >
                      <span>View</span>
                      <ChevronRightIcon size="xs" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Table Footer / Counter */}
      <div className="flex items-center justify-between border-t border-stocky-border-subtle px-4 py-3 text-xs text-stocky-text-sub bg-white rounded-b-2xl">
        <span>Showing {tasks.length} tasks</span>
      </div>
    </div>
  );
}
