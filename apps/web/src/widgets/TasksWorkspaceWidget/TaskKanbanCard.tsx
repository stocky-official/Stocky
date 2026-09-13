'use client';

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
} from '@stocky/icons';
import type {
  CompanyUserRole,
  StockTask,
  StockTaskItem,
} from '@stocky/types';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface TaskKanbanCardProps {
  task: StockTask;
  taskItems: StockTaskItem[];
  locationName?: string;
  assignee?: {
    id: string;
    full_name?: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  currentUserId?: string | null;
  userRole: CompanyUserRole;
  onOpenRunner: (task: StockTask) => void;
  onOpenReview: (task: StockTask) => void;
  onOpenDetails: (task: StockTask) => void;
}

function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(value))
    : '';
}

export function TaskKanbanCard({
  task,
  taskItems,
  locationName,
  assignee,
  currentUserId,
  userRole,
  onOpenRunner,
  onOpenReview,
  onOpenDetails,
}: TaskKanbanCardProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOccurredRef = React.useRef(false);

  const items = taskItems.filter((item) => item.taskId === task.id);
  const completedCount = items.filter((item) => item.status !== 'pending').length;

  const canRun =
    (task.assignedToCompanyUserId === currentUserId || userRole !== 'staff') &&
    ['assigned', 'in_progress', 'rejected'].includes(task.status);
  const canReview = userRole !== 'staff' && task.status === 'submitted';

  const handleClick = () => {
    if (dragOccurredRef.current) {
      dragOccurredRef.current = false;
      return;
    }
    if (canRun) {
      onOpenRunner(task);
      return;
    }
    if (canReview) {
      onOpenReview(task);
      return;
    }
    onOpenDetails(task);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    dragOccurredRef.current = true;
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ taskId: task.id, status: task.status })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Allow click event loop to pass before resetting dragOccurredRef
    setTimeout(() => {
      dragOccurredRef.current = false;
    }, 150);
  };

  return (
    <div
      tabIndex={0}
      role="button"
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-xl bg-white p-2.5 select-none text-left cursor-grab active:cursor-grabbing transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stocky-primary ${
        isDragging
          ? 'opacity-30 scale-[0.97] border-2 border-dashed border-stocky-border-subtle bg-stocky-bg-global/50 shadow-none'
          : 'border border-stocky-border-subtle/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_rgba(0,0,0,0.08),0_2px_6px_-2px_rgba(0,0,0,0.03)] hover:border-slate-300 active:scale-[0.985] active:translate-y-0 active:shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div>
        {/* Row 1: Type icon, Title & Item count pill */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-stocky-bg-global text-stocky-text-sub group-hover:bg-stocky-bg-global/70 transition-colors">
              {task.taskType === 'count' ? (
                <CheckCircleIcon size="xs" className="text-emerald-600" />
              ) : (
                <ClockIcon size="xs" className="text-amber-500" />
              )}
            </div>
            <h4 className="truncate text-xs font-semibold text-stocky-text-main group-hover:text-black transition-colors">
              {task.title}
            </h4>
          </div>

          <span className="shrink-0 rounded-md bg-stocky-bg-global px-1.5 py-0.5 text-[10px] font-medium text-stocky-text-sub border border-transparent group-hover:border-stocky-border-subtle/40 transition-colors">
            {completedCount}/{items.length}
          </span>
        </div>

        {/* Row 2: Location */}
        <div className="mt-1.5 flex items-center text-[10px] text-stocky-text-sub">
          <span className="truncate">{locationName || 'Location'}</span>
        </div>
      </div>

      {/* Row 3: Assignee & Date */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-stocky-border-subtle/60 pt-2 text-[10px] text-stocky-text-sub">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserAvatar
            src={assignee?.avatar_url}
            name={assignee?.full_name}
            email={assignee?.email}
            size="xs"
            className="h-4.5 w-4.5 shrink-0"
          />
          <span className="truncate font-medium text-stocky-text-sub group-hover:text-stocky-text-main transition-colors">
            {assignee?.full_name || assignee?.email?.split('@')[0] || 'Unassigned'}
          </span>
        </div>
        <span className="shrink-0 text-[10px] text-stocky-text-sub/80 font-normal">
          {formatDate(task.createdAt)}
        </span>
      </div>
    </div>
  );
}
