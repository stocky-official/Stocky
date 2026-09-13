'use client';

import React from 'react';
import type {
  CompanyUserRole,
  CreateStockTaskCommand,
  Location,
  Product,
  StockTaskType,
} from '@stocky/types';
import { StockTaskAssignmentWidget } from '../StockTaskAssignmentWidget/StockTaskAssignmentWidget';

export interface TaskAssignmentDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
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
  selectedLocationId?: string;
  userRole: CompanyUserRole;
  onCreate: (input: CreateStockTaskCommand) => Promise<void>;
  initialTaskType?: StockTaskType;
  selectedProductIds?: string[];
}

export function TaskAssignmentDrawerWidget({
  isOpen,
  onClose,
  products,
  locations,
  members,
  assignments = [],
  selectedLocationId = 'all',
  userRole,
  onCreate,
  initialTaskType = 'count',
  selectedProductIds = [],
}: TaskAssignmentDrawerWidgetProps) {
  return (
    <StockTaskAssignmentWidget
      isOpen={isOpen}
      onClose={onClose}
      taskType={initialTaskType}
      selectedProductIds={selectedProductIds}
      products={products}
      locations={locations}
      members={members}
      assignments={assignments}
      selectedLocationId={selectedLocationId}
      userRole={userRole}
      onCreate={onCreate}
    />
  );
}
