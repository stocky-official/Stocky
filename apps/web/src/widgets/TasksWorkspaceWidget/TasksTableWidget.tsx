'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
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
      <div className="overflow-x-auto">
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
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize ${
                        task.status === 'submitted'
                          ? 'stocky-status-info'
                          : task.status === 'in_progress'
                          ? 'stocky-status-warning'
                          : task.status === 'rejected'
                          ? 'stocky-status-critical'
                          : task.status === 'approved'
                          ? 'stocky-status-success'
                          : 'stocky-status-muted'
                      }`}
                    >
                      {statusLabel(task.status)}
                    </span>
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

      {/* Table Footer / Counter */}
      <div className="flex items-center justify-between border-t border-stocky-border-subtle px-4 py-3 text-xs text-stocky-text-sub bg-white rounded-b-2xl">
        <span>Showing {tasks.length} tasks</span>
      </div>
    </div>
  );
}
