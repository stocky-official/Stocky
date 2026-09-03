'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { XIcon, CheckCircleIcon, AlertCircleIcon } from '@stocky/icons';
import { supabase } from '@/lib/supabase/client';
import type { Item, Supplier, Branch, CompanyUserRole } from '@stocky/types';

export interface RecordEditDrawerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: 'item' | 'supplier' | 'branch';
  recordData: any;
  allCategories?: string[];
  userRole?: CompanyUserRole;
  onSaveSuccess?: (updatedData: any) => void;
}

/**
 * RecordEditDrawerWidget (v0.1.0 Design System)
 * Slide-over drawer portaled directly to document.body:
 * - 100% full-viewport backdrop coverage with zero gaps or unshaded top sections
 * - Framer Motion slide-in and fade animations
 * - Live editing for Inventory Items, Suppliers, and Branches
 * - Saves directly to Supabase Postgres
 */
export function RecordEditDrawerWidget({
  isOpen,
  onClose,
  recordType,
  recordData,
  allCategories = [],
  userRole = 'owner',
  onSaveSuccess,
}: RecordEditDrawerWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (recordData) {
      setFormData({ ...recordData });
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [recordData]);

  if (!mounted) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (recordType === 'item') {
        const { error } = await supabase
          .from('items')
          .update({
            name: formData.name,
            category_name: formData.categoryName,
            quantity: Number(formData.quantity) || 0,
            balance: Number(formData.balance) || 0,
            barcode: formData.barcode || null,
            expiry_date: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else if (recordType === 'supplier') {
        const { error } = await supabase
          .from('suppliers')
          .update({
            name: formData.name,
            contact_name: formData.contactName,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else if (recordType === 'branch') {
        const { error } = await supabase
          .from('branches')
          .update({
            name: formData.name,
            code: formData.code,
            address: formData.address || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', formData.id);

        if (error) throw error;
      }

      setSuccessMsg('Record saved successfully!');
      if (onSaveSuccess) {
        onSaveSuccess(formData);
      }

      // Close after a brief moment
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to save record:', err);
      setErrorMsg(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && recordData && (
        <div
          key="drawer-wrapper"
          className="fixed inset-0 z-[100] overflow-hidden"
          style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
        >
          {/* Full Viewport Backdrop (Spans 100% of the screen from pixel 0) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
            style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          />

          {/* Slide-over Drawer Panel Container */}
          <div
            className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-[101] pointer-events-none"
            style={{ top: 0, bottom: 0, right: 0, margin: 0 }}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="w-screen max-w-md h-screen bg-stocky-bg-widget border-l border-stocky-border-subtle flex flex-col justify-between select-none pointer-events-auto shadow-none"
              style={{ height: '100vh', top: 0, margin: 0 }}
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-stocky-border-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium text-stocky-text-main">
                      Edit {recordType === 'item' ? 'Inventory Item' : recordType === 'supplier' ? 'Supplier' : 'Branch'}
                    </span>
                    <Badge className="bg-stocky-primary/10 text-stocky-primary border-stocky-primary/20 text-[10px]">
                      ID: {String(recordData.id).slice(0, 8)}...
                    </Badge>
                  </div>
                  <p className="text-xs font-normal text-stocky-text-sub mt-0.5 truncate max-w-xs">
                    {formData.name || 'Update record information'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-widget text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global flex items-center justify-center transition-colors cursor-pointer"
                  title="Close drawer"
                >
                  <XIcon size="xs" />
                </button>
              </div>

              {/* Drawer Body / Form Fields */}
              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-widget bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                    <AlertCircleIcon size="xs" className="shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-widget bg-green-50 border border-green-200 text-green-700 flex items-center gap-2">
                    <CheckCircleIcon size="xs" className="shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Record: Inventory Item Fields */}
                {recordType === 'item' && (
                  <>
                    {userRole === 'staff' && (
                      <div className="p-2.5 rounded-widget bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2">
                        <AlertCircleIcon size="xs" className="shrink-0" />
                        <span className="text-[11px]">
                          Staff Access: Only stock count (quantity) can be adjusted. Master catalog fields are read-only.
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Item Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        disabled={userRole === 'staff'}
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="e.g. 1 Camel 1 Egp Djeep Lighter"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        disabled={userRole === 'staff'}
                        value={formData.categoryName || ''}
                        onChange={(e) => handleChange('categoryName', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-medium text-stocky-text-main block flex items-center justify-between">
                          <span>Stock Quantity (Units)</span>
                          {userRole === 'staff' && (
                            <span className="text-[10px] text-stocky-primary font-normal">Editable</span>
                          )}
                        </label>
                        <input
                          type="number"
                          min="0"
                          autoFocus={userRole === 'staff'}
                          value={formData.quantity ?? 0}
                          onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                          className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors ring-1 ring-stocky-primary/20"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-medium text-stocky-text-main block">
                          Stock Balance ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={userRole === 'staff'}
                          value={formData.balance ?? 0}
                          onChange={(e) => handleChange('balance', parseFloat(e.target.value) || 0)}
                          className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Barcode Identifier
                      </label>
                      <input
                        type="text"
                        disabled={userRole === 'staff'}
                        value={formData.barcode || ''}
                        onChange={(e) => handleChange('barcode', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="e.g. 6222008202109"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-medium text-stocky-text-main block text-xs">
                          Expiry Date
                        </label>
                        {formData.expiryDate && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              new Date(formData.expiryDate) < new Date()
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : new Date(formData.expiryDate).getTime() - new Date().getTime() <
                                  30 * 24 * 60 * 60 * 1000
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}
                          >
                            {new Date(formData.expiryDate) < new Date()
                              ? 'Expired'
                              : new Date(formData.expiryDate).getTime() - new Date().getTime() <
                                30 * 24 * 60 * 60 * 1000
                              ? 'Expiring Soon'
                              : 'Valid'}
                          </span>
                        )}
                      </div>
                      <input
                        type="date"
                        disabled={userRole === 'staff'}
                        value={
                          formData.expiryDate
                            ? new Date(formData.expiryDate).toISOString().split('T')[0]
                            : ''
                        }
                        onChange={(e) =>
                          handleChange('expiryDate', e.target.value ? e.target.value : null)
                        }
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
                  </>
                )}

                {/* Record: Supplier Fields */}
                {recordType === 'supplier' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Supplier Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactName || ''}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contactPhone || ''}
                        onChange={(e) => handleChange('contactPhone', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.contactEmail || ''}
                        onChange={(e) => handleChange('contactEmail', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                        placeholder="procurement@vendor.com"
                      />
                    </div>
                  </>
                )}

                {/* Record: Branch Fields */}
                {recordType === 'branch' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Branch Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Branch Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors uppercase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address || ''}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-medium text-stocky-text-main block">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full bg-stocky-bg-global border border-stocky-border-subtle rounded-widget px-3 py-2 text-xs text-stocky-text-main focus:outline-none focus:border-stocky-primary transition-colors"
                      />
                    </div>
                  </>
                )}
              </form>

              {/* Drawer Footer */}
              <div className="p-4 sm:p-5 border-t border-stocky-border-subtle flex items-center justify-end gap-3 bg-stocky-bg-widget">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-xs"
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 text-xs"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
