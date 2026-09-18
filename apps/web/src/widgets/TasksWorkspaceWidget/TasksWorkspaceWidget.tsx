'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type {
  CompanyUserRole,
  CreateStockTaskCommand,
  Location,
  Product,
  StockTask,
  StockTaskExpected,
  StockTaskItem,
} from '@stocky/types';
import { TasksToolbarWidget, type TaskQueue, type TaskViewMode } from './TasksToolbarWidget';
import {
  TasksFilterPanelWidget,
  type TasksFilterState,
} from './TasksFilterPanelWidget';
import { TasksTableWidget } from './TasksTableWidget';
import { TasksKanbanWidget, type KanbanColumnId } from './TasksKanbanWidget';
import { TaskRunnerDrawerWidget } from './TaskRunnerDrawerWidget';
import { TaskReviewDrawerWidget } from './TaskReviewDrawerWidget';
import { TaskDetailsDrawerWidget } from './TaskDetailsDrawerWidget';
import { TaskAssignmentDrawerWidget } from './TaskAssignmentDrawerWidget';
import { BottomSheet } from '@/components/ui';
import { useOptionalPlatform } from '@/views/platform/PlatformContext';
import { useTranslation } from '@/lib/i18n';

export interface TasksWorkspaceWidgetProps {
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  products: Product[];
  locations: Location[];
  members: Array<{
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role: CompanyUserRole;
    status?: string;
  }>;
  assignments?: Array<{ user_id: string; location_id: string }>;
  userRole: CompanyUserRole;
  currentUserId?: string | null;
  scanQuery?: string;
  activeTaskTab?: 'ongoing' | 'completed';
  onTaskTabChange?: (tab: 'ongoing' | 'completed') => void;
  onStartTask: (taskId: string) => Promise<void>;
  onSubmitTask: (
    taskId: string,
    items: Array<{
      taskItemId: string;
      countedQuantity?: number | null;
      observedExpiryDate?: string | null;
      note?: string | null;
    }>
  ) => Promise<void>;
  onReviewTask: (
    taskId: string,
    approve: boolean,
    note?: string
  ) => Promise<void>;
  onCreateTask?: (input: CreateStockTaskCommand) => Promise<void>;
}

const DEFAULT_FILTERS: TasksFilterState = {
  taskType: 'all',
  locationId: 'all',
  assigneeId: 'all',
  status: 'all',
};

export function TasksWorkspaceWidget({
  tasks,
  taskItems,
  taskExpected,
  products,
  locations,
  members,
  assignments = [],
  userRole,
  currentUserId,
  scanQuery = '',
  activeTaskTab: controlledTab,
  onTaskTabChange,
  onStartTask,
  onSubmitTask,
  onReviewTask,
  onCreateTask,
}: TasksWorkspaceWidgetProps) {
  const { t } = useTranslation();
  const platform = useOptionalPlatform();
  const effectiveTaskTab = controlledTab ?? platform?.taskTab ?? 'ongoing';
  const effectiveCreateTask = onCreateTask ?? platform?.createStockTask;
  const effectiveAssignments =
    assignments.length > 0
      ? assignments
      : platform?.teamAssignments ?? [];

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<TaskViewMode>('table');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filters, setFilters] = useState<TasksFilterState>(DEFAULT_FILTERS);

  // Drawer states
  const [runnerTask, setRunnerTask] = useState<StockTask | null>(null);
  const [reviewTask, setReviewTask] = useState<StockTask | null>(null);
  const [detailsTask, setDetailsTask] = useState<StockTask | null>(null);
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);

  const autoStartedTaskIds = useRef(new Set<string>());

  // Auto-start tasks whose scheduled work window has arrived
  useEffect(() => {
    const startDueTasks = () => {
      const currentTime = Date.now();
      tasks
        .filter(
          (task) =>
            task.assignedToCompanyUserId === currentUserId &&
            task.status === 'assigned' &&
            task.scheduledStartAt &&
            new Date(task.scheduledStartAt).getTime() <= currentTime
        )
        .forEach((task) => {
          if (autoStartedTaskIds.current.has(task.id)) return;
          autoStartedTaskIds.current.add(task.id);
          void onStartTask(task.id).catch(() =>
            autoStartedTaskIds.current.delete(task.id)
          );
        });
    };

    startDueTasks();
    const interval = window.setInterval(startDueTasks, 30000);
    return () => window.clearInterval(interval);
  }, [currentUserId, onStartTask, tasks]);

  const locationMap = useMemo(
    () => new Map(locations.map((loc) => [loc.id, loc.name])),
    [locations]
  );
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  // Sort tasks by operational urgency and creation timestamp
  const sortedTasks = useMemo(() => {
    return tasks.slice().sort((a, b) => {
      const priority: Record<StockTask['status'], number> = {
        submitted: 0,
        in_progress: 1,
        assigned: 2,
        rejected: 3,
        approved: 4,
        cancelled: 5,
      };
      return (
        priority[a.status] - priority[b.status] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, [tasks]);

  // Filter all tasks by search query and filter attributes
  const filteredTasks = useMemo(() => {
    return sortedTasks.filter((task) => {
      // Subtab Queue Check (Ongoing vs Completed)
      if (effectiveTaskTab === 'completed') {
        if (task.status !== 'approved' && task.status !== 'cancelled') {
          return false;
        }
      } else {
        if (task.status === 'approved' || task.status === 'cancelled') {
          return false;
        }
      }

      // Filter State Checks
      if (filters.taskType !== 'all' && task.taskType !== filters.taskType) {
        return false;
      }
      if (filters.locationId !== 'all' && task.locationId !== filters.locationId) {
        return false;
      }
      if (
        filters.assigneeId !== 'all' &&
        task.assignedToCompanyUserId !== filters.assigneeId
      ) {
        return false;
      }
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Search Query Check
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      const assignee = memberMap.get(task.assignedToCompanyUserId);
      const locationName = locationMap.get(task.locationId) || '';

      return [
        task.title,
        task.taskType,
        task.status,
        locationName,
        assignee?.full_name,
        assignee?.email,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(query));
    });
  }, [sortedTasks, filters, searchQuery, memberMap, locationMap, effectiveTaskTab]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.taskType !== 'all') count++;
    if (filters.locationId !== 'all') count++;
    if (filters.assigneeId !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  const canAssignTask = userRole !== 'staff';

  const handleTaskDrop = async (taskId: string, targetColumn: KanbanColumnId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine current column
    const currentColumn: KanbanColumnId =
      task.status === 'approved' || task.status === 'cancelled'
        ? 'completed'
        : (task.status as KanbanColumnId);
    if (currentColumn === targetColumn) return;

    // Target: in_progress
    if (targetColumn === 'in_progress') {
      if (task.status === 'assigned' || task.status === 'rejected') {
        try {
          await onStartTask(task.id);
        } catch (err: unknown) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : JSON.stringify(err);
          console.error('Failed to start task on drop:', message, err);
          // Fallback to opening runner drawer
          setReviewTask(null);
          setDetailsTask(null);
          setRunnerTask(task);
        }
      } else {
        setReviewTask(null);
        setDetailsTask(null);
        setRunnerTask(task);
      }
      return;
    }

    // Target: submitted (In Review)
    if (targetColumn === 'submitted') {
      // Submitting requires entering item counts and expiry dates
      setReviewTask(null);
      setDetailsTask(null);
      setRunnerTask(task);
      return;
    }

    // Target: rejected (Needs Correction)
    if (targetColumn === 'rejected') {
      if (task.status === 'submitted') {
        if (userRole !== 'staff') {
          try {
            await onReviewTask(task.id, false, 'Correction required');
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : typeof err === 'object' && err !== null && 'message' in err
                ? String((err as { message: unknown }).message)
                : JSON.stringify(err);
            console.error('Failed to send task back for correction on drop:', message, err);
            setRunnerTask(null);
            setDetailsTask(null);
            setReviewTask(task);
          }
        } else {
          setRunnerTask(null);
          setDetailsTask(null);
          setReviewTask(task);
        }
      } else {
        setReviewTask(null);
        setDetailsTask(null);
        setRunnerTask(task);
      }
      return;
    }

    // Target: completed
    if (targetColumn === 'completed') {
      if (task.status === 'submitted') {
        if (userRole !== 'staff') {
          try {
            await onReviewTask(task.id, true, 'Approved via Kanban');
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : typeof err === 'object' && err !== null && 'message' in err
                ? String((err as { message: unknown }).message)
                : JSON.stringify(err);
            console.error('Failed to approve task on drop:', message, err);
            setRunnerTask(null);
            setDetailsTask(null);
            setReviewTask(task);
          }
        } else {
          setRunnerTask(null);
          setDetailsTask(null);
          setReviewTask(task);
        }
      } else {
        // Unsubmitted tasks must be completed and submitted first
        setReviewTask(null);
        setDetailsTask(null);
        setRunnerTask(task);
      }
      return;
    }

    // Target: assigned
    if (targetColumn === 'assigned') {
      setRunnerTask(null);
      setReviewTask(null);
      setDetailsTask(task);
      return;
    }
  };

  return (
    <div className="stocky-task-workspace flex flex-col gap-4">
      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col relative z-20 overflow-visible">
        {/* Integrated Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle relative z-30">
          <TasksToolbarWidget
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterPanelOpen={filterPanelOpen}
            onToggleFilterPanel={() => setFilterPanelOpen((prev) => !prev)}
            activeFilterCount={activeFilterCount}
            canAssignTask={canAssignTask}
            onAssignTask={() => setAssignDrawerOpen(true)}
          />

          {/* Floating Filter Panel (Desktop) */}
          <AnimatePresence>
            {filterPanelOpen && (
              <div className="hidden sm:block absolute top-[calc(100%+8px)] inset-x-3 sm:inset-x-3.5 z-50">
                <TasksFilterPanelWidget
                  isOpen={filterPanelOpen}
                  onClose={() => setFilterPanelOpen(false)}
                  filters={filters}
                  onFilterChange={setFilters}
                  onResetFilters={() => setFilters(DEFAULT_FILTERS)}
                  matchingCount={filteredTasks.length}
                  totalCount={sortedTasks.length}
                  locations={locations}
                  members={members}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Filter Bottom Sheet Drawer */}
        <div className="sm:hidden">
          <BottomSheet
            mobileOnly
            isOpen={filterPanelOpen}
            onClose={() => setFilterPanelOpen(false)}
            title={t('common.filter') || 'Task Filters'}
            subtitle={`${t('inventory.showing')} ${filteredTasks.length} ${t('common.of')} ${sortedTasks.length} ${t('tasks.title')}`}
          >
            <TasksFilterPanelWidget
              isOpen={filterPanelOpen}
              onClose={() => setFilterPanelOpen(false)}
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
              matchingCount={filteredTasks.length}
              totalCount={sortedTasks.length}
              locations={locations}
              members={members}
              isMobile
            />
          </BottomSheet>
        </div>

        {/* Data View */}
        <div className="w-full">
          {viewMode === 'table' ? (
            <TasksTableWidget
              tasks={filteredTasks}
              taskItems={taskItems}
              products={products}
              locations={locations}
              members={members}
              userRole={userRole}
              currentUserId={currentUserId}
              searchQuery={searchQuery}
              canAssignTask={canAssignTask}
              onAssignTask={() => setAssignDrawerOpen(true)}
              onOpenRunner={(task) => {
                setReviewTask(null);
                setDetailsTask(null);
                setRunnerTask(task);
              }}
              onOpenReview={(task) => {
                setRunnerTask(null);
                setDetailsTask(null);
                setReviewTask(task);
              }}
              onOpenDetails={(task) => {
                setRunnerTask(null);
                setReviewTask(null);
                setDetailsTask(task);
              }}
            />
          ) : (
            <TasksKanbanWidget
              tasks={filteredTasks}
              taskItems={taskItems}
              products={products}
              locations={locations}
              members={members}
              userRole={userRole}
              currentUserId={currentUserId}
              searchQuery={searchQuery}
              canAssignTask={canAssignTask}
              onAssignTask={() => setAssignDrawerOpen(true)}
              onOpenRunner={(task) => {
                setReviewTask(null);
                setDetailsTask(null);
                setRunnerTask(task);
              }}
              onOpenReview={(task) => {
                setRunnerTask(null);
                setDetailsTask(null);
                setReviewTask(task);
              }}
              onOpenDetails={(task) => {
                setRunnerTask(null);
                setReviewTask(null);
                setDetailsTask(task);
              }}
              onTaskDrop={handleTaskDrop}
            />
          )}
        </div>
      </div>

      {/* Runner Drawer */}
      <TaskRunnerDrawerWidget
        task={runnerTask}
        taskItems={taskItems}
        products={products}
        scanQuery={scanQuery}
        onClose={() => setRunnerTask(null)}
        onStartTask={onStartTask}
        onSubmitTask={onSubmitTask}
      />

      {/* Review Drawer */}
      <TaskReviewDrawerWidget
        task={reviewTask}
        taskItems={taskItems}
        taskExpected={taskExpected}
        products={products}
        onClose={() => setReviewTask(null)}
        onReviewTask={onReviewTask}
      />

      {/* Details Drawer */}
      <TaskDetailsDrawerWidget
        task={detailsTask}
        taskItems={taskItems}
        products={products}
        locations={locations}
        members={members}
        onClose={() => setDetailsTask(null)}
      />

      {/* Assignment Drawer */}
      <TaskAssignmentDrawerWidget
        isOpen={assignDrawerOpen}
        onClose={() => setAssignDrawerOpen(false)}
        products={products}
        locations={locations}
        members={members}
        assignments={effectiveAssignments}
        userRole={userRole}
        onCreate={effectiveCreateTask || (async () => {})}
      />
    </div>
  );
}
