'use client';

import React from 'react';
import {
  TasksWorkspaceWidget,
  type TasksWorkspaceWidgetProps,
} from '@/widgets/TasksWorkspaceWidget';

export type StockTaskCenterWidgetProps = TasksWorkspaceWidgetProps;

/**
 * StockTaskCenterWidget
 * Backward-compatible wrapper delegating to TasksWorkspaceWidget.
 */
export function StockTaskCenterWidget(props: StockTaskCenterWidgetProps) {
  return <TasksWorkspaceWidget {...props} />;
}
