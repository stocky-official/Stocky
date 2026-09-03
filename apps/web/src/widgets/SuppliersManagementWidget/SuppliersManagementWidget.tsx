'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  TruckIcon,
  SearchIcon,
  TagIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Supplier } from '@stocky/types';
import { RecordEditDrawerWidget } from '../RecordEditDrawerWidget/RecordEditDrawerWidget';

export interface SuppliersManagementWidgetProps {
  suppliers: Supplier[];
}

/**
 * SuppliersManagementWidget (v0.1.0 Design System)
 * Displays company suppliers directory:
 * - Logical column order: Supplier Name -> Contact Person -> Phone -> Email -> Items Supplied -> Actions
 * - Excel-style clickable sort headers on all columns
 * - Spacious breathing room for action buttons (gap-2.5 with individual pill containers)
 * - Interactive Edit Drawer (RecordEditDrawerWidget) saving directly to Supabase
 * - Client-side pagination (25 suppliers/page) and live search
 */
export function SuppliersManagementWidget({
  suppliers: initialSuppliers,
}: SuppliersManagementWidgetProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dynamic viewport-adaptive pagination: fit records to viewport so pagination is always visible
  useEffect(() => {
    const calculatePageRows = () => {
      const vh = window.innerHeight;
      const availableHeight = Math.max(240, vh - 360);
      const rows = Math.max(5, Math.floor(availableHeight / 48));
      setPageSize(rows);
    };

    calculatePageRows();
    window.addEventListener('resize', calculatePageRows);
    return () => window.removeEventListener('resize', calculatePageRows);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Sorting state (Excel-style)
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Drawer state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setSuppliers(initialSuppliers);
  }, [initialSuppliers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortColumn, sortDirection]);

  // Excel-style sort toggle
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Filter & Sort Pipeline
  const filteredAndSortedSuppliers = useMemo(() => {
    let result = suppliers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const itemsSupplied = (s.itemsSupplied || []).join(' ').toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.contactName.toLowerCase().includes(q) ||
          (s.contactEmail && s.contactEmail.toLowerCase().includes(q)) ||
          s.contactPhone.includes(q) ||
          itemsSupplied.includes(q)
        );
      });
    }

    return result.slice().sort((a, b) => {
      let valA: any = a[sortColumn as keyof Supplier] || '';
      let valB: any = b[sortColumn as keyof Supplier] || '';

      if (sortColumn === 'itemCount') {
        valA = a.itemCount || 0;
        valB = b.itemCount || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [suppliers, searchQuery, sortColumn, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedSuppliers.length / pageSize) || 1;
  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedSuppliers.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedSuppliers, currentPage, pageSize]);

  const startRange =
    filteredAndSortedSuppliers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, filteredAndSortedSuppliers.length);

  // Edit / Delete handlers
  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDrawerOpen(true);
  };

  const handleSaveSuccess = (updatedSupplier: any) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === updatedSupplier.id ? { ...s, ...updatedSupplier } : s
      )
    );
  };

  const handleDeleteClick = async (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      try {
        const { error } = await supabase
          .from('suppliers')
          .delete()
          .eq('id', supplier.id);
        if (error) throw error;
        setSuppliers((prev) => prev.filter((s) => s.id !== supplier.id));
      } catch (err: any) {
        alert('Failed to delete supplier: ' + err.message);
      }
    }
  };

  const renderSortIndicator = (columnKey: string) => {
    if (sortColumn === columnKey) {
      return sortDirection === 'asc' ? (
        <ArrowUpIcon size="xs" className="text-stocky-primary shrink-0" />
      ) : (
        <ArrowDownIcon size="xs" className="text-stocky-primary shrink-0" />
      );
    }
    return (
      <ArrowUpDownIcon
        size="xs"
        className="text-stocky-text-sub/40 group-hover:text-stocky-text-sub shrink-0"
      />
    );
  };

  return (
    <>
      <Card className="p-0 overflow-hidden bg-stocky-bg-widget border border-stocky-border-subtle rounded-widget">
        {/* Header Bar & Search Filter */}
        <div className="p-4 sm:p-5 border-b border-stocky-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-medium text-stocky-text-main">
              Suppliers & Vendors Directory ({filteredAndSortedSuppliers.length})
            </h2>
            <p className="text-xs font-normal text-stocky-text-sub mt-0.5">
              Registered distributors, supplied items catalog, and procurement contacts
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stocky-text-sub pointer-events-none">
              <SearchIcon size="xs" />
            </span>
            <input
              type="text"
              placeholder="Search suppliers, contact, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 bg-stocky-bg-global border border-stocky-border-subtle rounded-widget pl-8 pr-8 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:outline-none focus:border-stocky-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main transition-colors p-0.5 cursor-pointer"
                title="Clear search"
              >
                <XIcon size="xs" />
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stocky-bg-global text-stocky-text-sub border-b border-stocky-border-subtle select-none">
                {/* 1. Supplier Name */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-medium min-w-[220px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supplier Name</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                {/* 2. Contact Person */}
                <th
                  onClick={() => handleSort('contactName')}
                  className="py-3 px-4 font-medium min-w-[140px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Contact Person</span>
                    {renderSortIndicator('contactName')}
                  </div>
                </th>

                {/* 3. Phone Number */}
                <th
                  onClick={() => handleSort('contactPhone')}
                  className="py-3 px-4 font-medium min-w-[130px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Phone Number</span>
                    {renderSortIndicator('contactPhone')}
                  </div>
                </th>

                {/* 4. Email Address */}
                <th
                  onClick={() => handleSort('contactEmail')}
                  className="py-3 px-4 font-medium min-w-[170px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email Address</span>
                    {renderSortIndicator('contactEmail')}
                  </div>
                </th>

                {/* 5. Items / Categories Supplied */}
                <th
                  onClick={() => handleSort('itemCount')}
                  className="py-3 px-4 font-medium min-w-[200px] cursor-pointer hover:text-stocky-primary transition-colors group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Items / Categories Supplied</span>
                    {renderSortIndicator('itemCount')}
                  </div>
                </th>

                {/* 6. Actions */}
                <th className="py-3 px-4 font-medium text-right w-28 min-w-[110px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stocky-border-subtle">
              {paginatedSuppliers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs font-normal text-stocky-text-sub"
                  >
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                paginatedSuppliers.map((supplier) => {
                  const suppliedList = supplier.itemsSupplied || ['General Inventory'];
                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-stocky-bg-global/50 transition-colors"
                    >
                      {/* 1. Supplier Name */}
                      <td className="py-3.5 px-4 font-medium text-stocky-text-main min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-widget bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-center text-stocky-accent shrink-0">
                            <TruckIcon size="xs" />
                          </div>
                          <div>
                            <span className="block">{supplier.name}</span>
                            {supplier.itemCount && supplier.itemCount > 0 ? (
                              <span className="text-[10px] font-normal text-stocky-text-sub">
                                {supplier.itemCount.toLocaleString()} SKUs supplied
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Person */}
                      <td className="py-3.5 px-4 font-medium text-stocky-text-main whitespace-nowrap min-w-[140px]">
                        {supplier.contactName}
                      </td>

                      {/* 3. Phone Number */}
                      <td className="py-3.5 px-4 text-stocky-text-sub whitespace-nowrap min-w-[130px]">
                        {supplier.contactPhone}
                      </td>

                      {/* 4. Email Address */}
                      <td className="py-3.5 px-4 text-stocky-text-sub whitespace-nowrap min-w-[170px]">
                        {supplier.contactEmail ? (
                          <a
                            href={`mailto:${supplier.contactEmail}`}
                            className="hover:underline text-stocky-primary font-normal"
                          >
                            {supplier.contactEmail}
                          </a>
                        ) : (
                          <span className="text-stocky-text-sub/50">—</span>
                        )}
                      </td>

                      {/* 5. Items They Supply */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {suppliedList.slice(0, 4).map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-widget text-[11px] font-normal bg-stocky-bg-global text-stocky-text-sub border border-stocky-border-subtle truncate max-w-[180px]"
                              title={item}
                            >
                              <TagIcon size="xs" className="text-stocky-accent" />
                              {item}
                            </span>
                          ))}
                          {suppliedList.length > 4 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-widget text-[10px] font-normal text-stocky-text-sub bg-stocky-bg-global border border-stocky-border-subtle">
                              +{suppliedList.length - 4} more
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Actions (Generous Breathing Room) */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap w-28 min-w-[110px]">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleEditClick(supplier)}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub hover:text-stocky-primary hover:border-stocky-primary/40 flex items-center justify-center transition-all cursor-pointer"
                            title={`Edit ${supplier.name}`}
                          >
                            <EditIcon size="xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(supplier)}
                            className="w-7 h-7 rounded-widget bg-stocky-bg-global/70 hover:bg-red-50 border border-stocky-border-subtle hover:border-red-200 text-stocky-text-sub hover:text-red-600 flex items-center justify-center transition-all cursor-pointer"
                            title={`Delete ${supplier.name}`}
                          >
                            <TrashIcon size="xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 sm:p-4 border-t border-stocky-border-subtle bg-stocky-bg-widget flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stocky-text-sub">
          <div>
            Showing <span className="font-medium text-stocky-text-main">{startRange.toLocaleString()}</span> to{' '}
            <span className="font-medium text-stocky-text-main">{endRange.toLocaleString()}</span> of{' '}
            <span className="font-medium text-stocky-text-main">{filteredAndSortedSuppliers.length.toLocaleString()}</span> suppliers
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-xs"
            >
              Previous
            </Button>

            <span className="text-xs font-medium text-stocky-text-main px-2">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Interactive Edit Drawer for Supplier */}
      <RecordEditDrawerWidget
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        recordType="supplier"
        recordData={editingSupplier}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  );
}
