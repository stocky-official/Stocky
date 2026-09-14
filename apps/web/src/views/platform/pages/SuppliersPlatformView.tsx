import React from 'react';
import type { Location, Product, Supplier, SupplierContact, SupplierProduct, SupplierRequest, CompanyUserRole } from '@stocky/types';
import type { SupplierContactInput } from '@/widgets';
import { PlatformPageLayout } from './PlatformPageLayout';
import { SuppliersWorkspaceWidget } from '@/widgets';

import { useOptionalPlatform } from '@/views/platform/PlatformContext';

export interface SuppliersPlatformViewProps {
  requests: SupplierRequest[];
  products: Product[];
  locations: Location[];
  suppliers: Supplier[];
  supplierContacts: SupplierContact[];
  supplierProducts: SupplierProduct[];
  userRole: CompanyUserRole;
  selectedLocationId: string;
  defaultProductId?: string;
  activeSupplierTab?: 'suppliers' | 'requests';
  onSupplierTabChange?: (tab: 'suppliers' | 'requests') => void;
  onCreate: (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => void;
  onCreateSupplier: (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string; imageUrl?: string }) => Promise<unknown>;
  onCreateSupplierContact: (input: SupplierContactInput) => Promise<void>;
  onUpdateSupplierContact: (contact: SupplierContact, input: SupplierContactInput) => Promise<void>;
  onDeleteSupplierContact: (contact: SupplierContact) => Promise<void>;
  onSetPrimarySupplierContact: (contact: SupplierContact) => Promise<void>;
  onStatusChange: (request: SupplierRequest, status: SupplierRequest['status']) => void;
  onLinkProduct: (input: { supplierId: string; productId: string; supplierSku?: string; unitCost?: number }) => Promise<void>;
  onUnlinkProduct: (supplierProductId: string) => Promise<void>;
}

/**
 * SuppliersPlatformView (PageView)
 * Orchestrates layout, header, and the supplier management / requests workspace.
 */
export function SuppliersPlatformView(props: SuppliersPlatformViewProps) {
  const platform = useOptionalPlatform();
  const activeSupplierTab = props.activeSupplierTab ?? platform?.supplierTab;
  const onSupplierTabChange = props.onSupplierTabChange ?? platform?.setSupplierTab;

  const isRequests = activeSupplierTab === 'requests';

  return (
    <PlatformPageLayout
      title={isRequests ? 'Supplier Requests' : 'Suppliers'}
      subtitle={
        isRequests
          ? 'Track purchase requests, restocking orders, and vendor fulfillment status across your locations.'
          : 'Manage supplier contacts, catalog links, and replenishment requests.'
      }
    >
      <SuppliersWorkspaceWidget
        {...props}
        activeSupplierTab={activeSupplierTab}
        onSupplierTabChange={onSupplierTabChange}
      />
    </PlatformPageLayout>
  );
}
