'use client';

import React from 'react';
import { KanbanIcon, PlusIcon, TableIcon } from '@stocky/icons';
import { StandardToolbarWidget } from '../StandardToolbarWidget/StandardToolbarWidget';
import { useTranslation } from '@/lib/i18n';

export type TaskQueue = 'ongoing' | 'completed';
export type TaskViewMode = 'table' | 'kanban';

export interface TasksToolbarWidgetProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  viewMode?: TaskViewMode;
  onViewModeChange?: (mode: TaskViewMode) => void;
  activeQueue?: TaskQueue;
  onQueueChange?: (queue: TaskQueue) => void;
  ongoingCount?: number;
  completedCount?: number;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  activeFilterCount: number;
  canAssignTask: boolean;
  onAssignTask: () => void;
}

/**
 * Standardized toolbar component for Tasks workspace.
 * Features uniform 40px single-row geometry, split search with filter icon,
 * compact Table/Kanban switcher, and primary + action button.
 */
export function TasksToolbarWidget({
  searchQuery,
  onSearchChange,
  viewMode = 'table',
  onViewModeChange,
  filterPanelOpen,
  onToggleFilterPanel,
  activeFilterCount,
  canAssignTask,
  onAssignTask,
}: TasksToolbarWidgetProps) {
  const { t } = useTranslation();

  const viewSwitcher = onViewModeChange ? (
    <div
      className="inline-flex items-center rounded-full border border-stocky-border-subtle p-0.5 bg-stocky-bg-global"
      role="group"
      aria-label="Task view mode"
    >
      <button
        type="button"
        onClick={() => onViewModeChange('table')}
        className={`h-9 px-2.5 sm:px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
          viewMode === 'table'
            ? 'bg-white text-stocky-text-main shadow-xs font-semibold'
            : 'text-stocky-text-sub hover:text-stocky-text-main'
        }`}
        title="Table view"
        aria-pressed={viewMode === 'table'}
      >
        <TableIcon size="xs" />
        <span className="hidden sm:inline">{t('common.table') || 'Table'}</span>
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange('kanban')}
        className={`h-9 px-2.5 sm:px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
          viewMode === 'kanban'
            ? 'bg-white text-stocky-text-main shadow-xs font-semibold'
            : 'text-stocky-text-sub hover:text-stocky-text-main'
        }`}
        title="Kanban view"
        aria-pressed={viewMode === 'kanban'}
      >
        <KanbanIcon size="xs" />
        <span className="hidden sm:inline">{t('common.kanban') || 'Kanban'}</span>
      </button>
    </div>
  ) : undefined;

  return (
    <StandardToolbarWidget
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('common.search') || 'Search tasks by title, type, location...'}
      isFilterOpen={filterPanelOpen}
      onToggleFilter={onToggleFilterPanel}
      activeFilterCount={activeFilterCount}
      viewSwitcher={viewSwitcher}
      primaryAction={
        canAssignTask
          ? {
              label: t('tasks.assignTask') || 'Assign task',
              icon: <PlusIcon size="xs" />,
              onClick: onAssignTask,
              title: t('tasks.assignTask') || 'Assign new task',
            }
          : undefined
      }
    />
  );
}
