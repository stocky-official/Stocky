'use client';

import React from 'react';
import { FilterIcon, KanbanIcon, PlusIcon, SearchIcon, TableIcon, XIcon } from '@stocky/icons';

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
  return (
    <div className="stocky-stock-table-toolbar relative">
      {/* Search Input Group */}
      <div className="stocky-stock-table-toolbar__search-group flex items-center gap-2 min-w-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size="xs"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub"
          />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks by title, type, location, or assignee..."
            className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-widget pl-9 pr-10 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <XIcon size="xs" />
            </button>
          ) : null}

          {/* Filter Popover Button */}
          <button
            type="button"
            onClick={onToggleFilterPanel}
            aria-label="Filter tasks"
            aria-expanded={filterPanelOpen}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              filterPanelOpen || activeFilterCount > 0
                ? 'bg-stocky-primary text-white hover:bg-stocky-primary-hover'
                : 'text-stocky-text-sub hover:bg-stocky-bg-hover hover:text-stocky-text-main'
            }`}
            title="Filter by attributes"
          >
            <FilterIcon size="xs" />
            {activeFilterCount > 0 && !filterPanelOpen && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stocky-primary px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="stocky-stock-table-toolbar__actions flex items-center gap-2 shrink-0">
        {onViewModeChange && (
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
              <span className="hidden sm:inline">Table</span>
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
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>
        )}

        {canAssignTask && (
          <button
            type="button"
            onClick={onAssignTask}
            className="stocky-table-toolbar-button stocky-table-toolbar-button--primary h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <PlusIcon size="xs" />
            <span>Assign task</span>
          </button>
        )}
      </div>
    </div>
  );
}
