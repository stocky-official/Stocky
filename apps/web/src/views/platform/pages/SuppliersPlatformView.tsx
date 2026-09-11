import React from 'react';
import type { Location, Product, Supplier, SupplierContact, SupplierProduct, SupplierRequest, CompanyUserRole } from '@stocky/types';
import type { SupplierContactInput } from '@/widgets';
import { PlatformPageLayout } from './PlatformPageLayout';
import { SupplierRequestsWidget } from '@/widgets';

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
  onCreate: (input: { productId: string; locationId: string; supplierId?: string; requestType: 'replenish' | 'return' | 'replace'; quantity?: number }) => void;
  onCreateSupplier: (input: { name: string; address?: string; contactName: string; contactPhone: string; contactEmail?: string }) => Promise<unknown>;
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
  return (
    <PlatformPageLayout
      eyebrow="Supplier follow-up"
      title="Suppliers"
      subtitle="Manage supplier contacts, catalog links, and replenishment requests."
    >
      <SupplierRequestsWidget {...props} />
    </PlatformPageLayout>
  );
}
