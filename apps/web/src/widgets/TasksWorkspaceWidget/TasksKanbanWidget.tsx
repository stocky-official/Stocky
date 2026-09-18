'use client';

import React, { useMemo } from 'react';
import { CheckCircleIcon, PlusIcon } from '@stocky/icons';
import type {
  CompanyUserRole,
  Location,
  Product,
  StockTask,
  StockTaskItem,
} from '@stocky/types';
import { TaskKanbanCard } from './TaskKanbanCard';
import { useTranslation } from '@/lib/i18n';

type TeamMember = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: CompanyUserRole;
  status?: string;
};

export type KanbanColumnId =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'rejected'
  | 'completed';

export interface TasksKanbanWidgetProps {
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  products: Product[];
  locations: Location[];
  members: TeamMember[];
  userRole: CompanyUserRole;
  currentUserId?: string | null;
  searchQuery: string;
  canAssignTask: boolean;
  onAssignTask: () => void;
  onOpenRunner: (task: StockTask) => void;
  onOpenReview: (task: StockTask) => void;
  onOpenDetails: (task: StockTask) => void;
  onTaskDrop?: (taskId: string, targetColumn: KanbanColumnId) => void;
}

interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  dotColorClass: string;
  emptyText: string;
}

export function TasksKanbanWidget({
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
  onTaskDrop,
}: TasksKanbanWidgetProps) {
  const { t } = useTranslation();
  const [dragOverColumn, setDragOverColumn] = React.useState<KanbanColumnId | null>(null);

  const columns: KanbanColumnConfig[] = useMemo(
    () => [
      {
        id: 'assigned',
        title: t('tasks.statusAssigned'),
        dotColorClass: 'bg-slate-400',
        emptyText: t('tasks.kanbanEmptyAssigned'),
      },
      {
        id: 'in_progress',
        title: t('tasks.statusInProgress'),
        dotColorClass: 'bg-amber-500',
        emptyText: t('tasks.kanbanEmptyInProgress'),
      },
      {
        id: 'submitted',
        title: t('tasks.statusSubmitted'),
        dotColorClass: 'bg-blue-500',
        emptyText: t('tasks.kanbanEmptySubmitted'),
      },
      {
        id: 'rejected',
        title: t('tasks.statusRejected'),
        dotColorClass: 'bg-rose-500',
        emptyText: t('tasks.kanbanEmptyRejected'),
      },
      {
        id: 'completed',
        title: t('tasks.completed'),
        dotColorClass: 'bg-emerald-500',
        emptyText: t('tasks.kanbanEmptyCompleted'),
      },
    ],
    [t]
  );

  const locationMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  // Group tasks across the 5 columns
  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanColumnId, StockTask[]> = {
      assigned: [],
      in_progress: [],
      submitted: [],
      rejected: [],
      completed: [],
    };
    tasks.forEach((task) => {
      if (task.status === 'approved' || task.status === 'cancelled') {
        grouped.completed.push(task);
      } else if (grouped[task.status as KanbanColumnId]) {
        grouped[task.status as KanbanColumnId].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: KanbanColumnId) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverColumn === colId) {
        setDragOverColumn(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onTaskDrop) {
      onTaskDrop(taskId, colId);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="px-5 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stocky-bg-global text-stocky-text-sub">
          <CheckCircleIcon size="md" />
        </div>
        <h3 className="mt-3 text-sm font-medium text-stocky-text-main">
          {searchQuery ? t('tasks.noMatchingTasks') : t('tasks.noTasksFound')}
        </h3>
        <p className="mt-1 max-w-sm mx-auto text-xs text-stocky-text-sub">
          {searchQuery
            ? t('tasks.noMatchingTasksDesc')
            : t('tasks.noTasksDesc')}
        </p>
        {!searchQuery && canAssignTask && (
          <button
            type="button"
            onClick={onAssignTask}
            className="mt-4 stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>{t('tasks.assignTask')}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-3.5">
      {/* 1. Mobile Layout (< 768px): Column Headings with Horizontal Swipeable Card Rails */}
      <div className="flex flex-col gap-4 md:hidden">
        {columns.map((column) => {
          const colTasks = tasksByColumn[column.id] || [];
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col gap-1.5 rounded-xl p-1.5 transition-colors ${
                isOver
                  ? 'bg-stocky-primary/[0.05] ring-2 ring-stocky-primary/30'
                  : ''
              }`}
            >
              {/* Column Heading */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${column.dotColorClass}`} />
                  <h3 className="text-xs font-semibold text-stocky-text-main">
                    {column.title}
                  </h3>
                </div>
                <span className="rounded-full bg-stocky-bg-global px-2 py-0.5 text-[10px] font-bold text-stocky-text-sub">
                  {colTasks.length}
                </span>
              </div>

              {/* Horizontal Swipeable Card Rail */}
              {colTasks.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory scrollbar-none -mx-3 px-3">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="w-[230px] shrink-0 snap-start"
                    >
                      <TaskKanbanCard
                        task={task}
                        taskItems={taskItems}
                        locationName={locationMap.get(task.locationId)}
                        assignee={memberMap.get(task.assignedToCompanyUserId)}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        onOpenRunner={onOpenRunner}
                        onOpenReview={onOpenReview}
                        onOpenDetails={onOpenDetails}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-stocky-border-subtle/80 p-3 text-center text-[11px] text-stocky-text-sub bg-stocky-bg-global/30">
                  {column.emptyText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Layout (>= 768px): 5-Column Board */}
      <div className="hidden md:grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {columns.map((column) => {
          const colTasks = tasksByColumn[column.id] || [];
          const isOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-xl p-2 border min-h-[460px] transition-all duration-150 ${
                isOver
                  ? 'border-stocky-primary/60 bg-stocky-primary/[0.04] ring-2 ring-stocky-primary/25 shadow-xs'
                  : 'bg-stocky-bg-global/40 border-stocky-border-subtle/60'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 rounded-lg bg-stocky-bg-global">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${column.dotColorClass}`} />
                  <span className="truncate text-xs font-semibold text-stocky-text-main">
                    {column.title}
                  </span>
                </div>
                <span className="rounded-md bg-white px-1.5 py-0.2 text-[10px] font-bold text-stocky-text-sub shadow-2xs border border-stocky-border-subtle/60">
                  {colTasks.length}
                </span>
              </div>

              {/* Drop Target Indicator when dragging over */}
              {isOver && (
                <div className="mb-2 flex items-center justify-center rounded-xl border-2 border-dashed border-stocky-primary/50 bg-stocky-primary/10 py-2.5 text-center text-[11px] font-medium text-stocky-primary animate-pulse">
                  {t('tasks.kanbanDropToMove', { column: column.title })}
                </div>
              )}

              {/* Vertical Card Stack */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                {colTasks.length > 0 ? (
                  colTasks.map((task) => (
                    <TaskKanbanCard
                      key={task.id}
                      task={task}
                      taskItems={taskItems}
                      locationName={locationMap.get(task.locationId)}
                      assignee={memberMap.get(task.assignedToCompanyUserId)}
                      currentUserId={currentUserId}
                      userRole={userRole}
                      onOpenRunner={onOpenRunner}
                      onOpenReview={onOpenReview}
                      onOpenDetails={onOpenDetails}
                    />
                  ))
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-stocky-border-subtle/70 p-4 text-center text-[11px] text-stocky-text-sub">
                    {column.emptyText}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
