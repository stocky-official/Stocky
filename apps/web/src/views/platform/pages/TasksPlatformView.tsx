import React from 'react';
import type {
  CompanyUserRole,
  CreateStockTaskCommand,
  Location,
  Product,
  StockTask,
  StockTaskExpected,
  StockTaskItem,
} from '@stocky/types';
import { ActivityIcon } from '@stocky/icons';
import { PlatformPageLayout } from './PlatformPageLayout';
import { TasksWorkspaceWidget } from '@/widgets';

import { useOptionalPlatform } from '@/views/platform/PlatformContext';

export interface TasksPlatformViewProps {
  tasks: StockTask[];
  taskItems: StockTaskItem[];
  taskExpected: StockTaskExpected[];
  products: Product[];
  locations: Location[];
  members: any[];
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

/**
 * TasksPlatformView (PageView)
 * Orchestrates layout, header, ongoing badge, and task center queue.
 */
export function TasksPlatformView(props: TasksPlatformViewProps) {
  const platform = useOptionalPlatform();
  const activeTaskTab = props.activeTaskTab ?? platform?.taskTab;
  const onTaskTabChange = props.onTaskTabChange ?? platform?.setTaskTab;
  const onCreateTask = props.onCreateTask ?? platform?.createStockTask;
  const assignments = props.assignments ?? platform?.teamAssignments ?? [];
  const ongoingCount = props.tasks.filter((task) =>
    ['assigned', 'in_progress', 'rejected', 'submitted'].includes(task.status)
  ).length;

  return (
    <PlatformPageLayout
      title="Stock tasks"
      subtitle="Assigned counts and expiry checks stay here. Permanent actions are recorded in Logs."
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full stocky-status-info border px-2.5 py-1 text-[11px]">
          <ActivityIcon size="xs" />
          <span>{ongoingCount} ongoing</span>
        </span>
      }
    >
      <TasksWorkspaceWidget
        {...props}
        activeTaskTab={activeTaskTab}
        onTaskTabChange={onTaskTabChange}
        onCreateTask={onCreateTask}
        assignments={assignments}
      />
    </PlatformPageLayout>
  );
}
