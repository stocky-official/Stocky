'use client';

import React from 'react';
import {
  SuppliersWorkspaceWidget,
  type SuppliersWorkspaceWidgetProps,
} from '../SuppliersWorkspaceWidget';

export type SupplierRequestsWidgetProps = SuppliersWorkspaceWidgetProps;

/**
 * Backward-compatibility wrapper for SuppliersWorkspaceWidget.
 */
export function SupplierRequestsWidget(props: SupplierRequestsWidgetProps) {
  return <SuppliersWorkspaceWidget {...props} />;
}
