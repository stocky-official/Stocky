'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  BoxesIcon,
  BoxIcon,
  CheckCircleIcon,
  ClockIcon,
  EditIcon,
  ShieldIcon,
  UsersIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import { SideDrawer } from '@/components/ui';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';

export interface AdminCompanyItem {
  id: string; // company id or application id
  companyId: string | null;
  applicationId: string | null;
  name: string;
  code: string | null;
  logoUrl: string | null;
  status: 'verified' | 'pending' | 'rejected' | 'suspended';
  initialBranchName: string | null;
  requestedEmail: string;
  reviewNote: string | null;
  verifiedAt: string | null;
  createdAt: string;
  branchesCount?: number;
  usersCount?: number;
  productsCount?: number;
}

export interface AdminCompanyProfileDrawerWidgetProps {
  company: AdminCompanyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function AdminCompanyProfileDrawerWidget({
  company,
  isOpen,
  onClose,
  onUpdated,
}: AdminCompanyProfileDrawerWidgetProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'branches' | 'team' | 'products'>('overview');
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Loaded child records for the selected company
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!company) return;
    setReviewNote(company.reviewNote || '');
    setActionError(null);
    setActiveTab('overview');

    // If company exists in companies table, fetch its operational entities
    const cid = company.companyId;
    if (cid) {
      setLoadingDetails(true);
      Promise.all([
        supabase.from('branches').select('id, name, code, is_active, created_at').eq('company_id', cid),
        supabase.from('company_users').select('id, email, role, status, created_at').eq('company_id', cid),
        supabase.from('products').select('id, name, sku, price, cost, created_at').eq('company_id', cid).limit(20),
      ])
        .then(([bRes, uRes, pRes]) => {
          setBranches(bRes.data || []);
          setUsers(uRes.data || []);
          setProducts(pRes.data || []);
        })
        .finally(() => {
          setLoadingDetails(false);
        });
    } else {
      setBranches([]);
      setUsers([]);
      setProducts([]);
    }
  }, [company]);

  if (!company) return null;

  const handleReviewAction = async (action: 'approve' | 'reject') => {
    if (!company.applicationId) {
      setActionError('Cannot process verification: application ID missing.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const rpcName = action === 'approve' ? 'approve_company_application' : 'reject_company_application';
      const { error } = await supabase.rpc(rpcName, {
        p_application_id: company.applicationId,
        p_review_note: reviewNote.trim() || null,
      });

      if (error) throw error;

      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error(`Failed to ${action} company:`, err);
      setActionError(err?.message || `Failed to ${action} company.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspendCompany = async () => {
    if (!company.companyId) return;
    const confirm = window.confirm(`Are you sure you want to suspend access for ${company.name}?`);
    if (!confirm) return;

    setIsProcessing(true);
    setActionError(null);

    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'suspended', verification_note: reviewNote.trim() || null })
        .eq('id', company.companyId);

      if (error) throw error;

      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to suspend company:', err);
      setActionError(err?.message || 'Failed to suspend company.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateCompany = async () => {
    if (!company.companyId) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'verified', verification_note: reviewNote.trim() || null })
        .eq('id', company.companyId);

      if (error) throw error;

      onUpdated?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to reactivate company:', err);
      setActionError(err?.message || 'Failed to reactivate company.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isPending = company.status === 'pending';
  const isVerified = company.status === 'verified';
  const isSuspended = company.status === 'suspended';

  return (
    <SideDrawer
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={`Company Profile - ${company.name}`}
      widthClassName="md:w-[540px] lg:w-[600px]"
    >
      <div className="flex flex-col h-full bg-white text-start">
        {/* Drawer Header */}
        <div className="p-5 border-b border-stocky-border-subtle flex items-start justify-between gap-4 bg-stocky-bg-global/50">
          <div className="flex items-start gap-3.5 min-w-0">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                referrerPolicy="no-referrer"
                className="h-12 w-12 rounded-2xl object-cover border border-stocky-border-subtle shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stocky-primary/10 text-stocky-primary border border-stocky-border-subtle shrink-0 font-bold text-base">
                {company.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-stocky-text-main truncate">
                  {company.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                    isVerified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : isPending
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isVerified ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                  />
                  <span>{company.status.toUpperCase()}</span>
                </span>
              </div>

              <p className="text-xs text-stocky-text-sub mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-mono bg-stocky-bg-widget px-1.5 py-0.5 rounded border border-stocky-border-subtle text-[11px]">
                  {company.code || 'no-slug'}
                </span>
                <span>·</span>
                <span>Applied {new Date(company.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stocky-text-sub hover:text-stocky-text-main hover:bg-stocky-bg-global transition-colors cursor-pointer shrink-0"
          >
            <XIcon size="xs" />
          </button>
        </div>

        {/* Subtabs Rail */}
        <div className="flex items-center gap-1 px-5 border-b border-stocky-border-subtle bg-white overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-stocky-primary text-stocky-primary'
                : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Overview & Verification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branches')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'branches'
                ? 'border-stocky-primary text-stocky-primary'
                : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Branches ({branches.length || (company.initialBranchName ? 1 : 0)})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'border-stocky-primary text-stocky-primary'
                : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Team ({users.length || 1})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-3 font-semibold transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-stocky-primary text-stocky-primary'
                : 'border-transparent text-stocky-text-sub hover:text-stocky-text-main'
            }`}
          >
            Products ({products.length})
          </button>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="m-5 mb-0 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircleIcon size="xs" className="shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW & VERIFICATION */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Tenant Workspace Launcher */}
              {isVerified && company.code && (
                <div className="p-4 rounded-2xl bg-stocky-bg-global border border-stocky-border-subtle flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-stocky-text-main block">
                      Live Tenant Workspace
                    </span>
                    <span className="text-[11px] text-stocky-text-sub font-mono block mt-0.5">
                      /{company.code}
                    </span>
                  </div>
                  <Link
                    href={`/${company.code}`}
                    target="_blank"
                    className="h-8.5 px-3.5 rounded-full border border-stocky-border-subtle bg-white hover:border-stocky-primary hover:text-stocky-primary text-xs font-semibold text-stocky-text-main transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Launch Workspace</span>
                    <ArrowUpRightIcon size="xs" />
                  </Link>
                </div>
              )}

              {/* Requester Profile Cardlet */}
              <div className="p-4 rounded-2xl bg-white border border-stocky-border-subtle shadow-2xs space-y-3">
                <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
                  Applicant & Contact Information
                </span>
                <div className="flex items-center gap-3">
                  <UserAvatar email={company.requestedEmail} size="md" className="ring-1 ring-stocky-border-subtle" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-stocky-text-main block truncate">
                      {company.requestedEmail}
                    </span>
                    <span className="text-[11px] text-stocky-text-sub block">
                      Tenant Organization Owner
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Assessment Controls */}
              <div className="p-4 rounded-2xl bg-white border border-stocky-border-subtle shadow-2xs space-y-4">
                <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
                  Platform Verification Controls
                </span>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-stocky-text-main block">
                    Review / Verification Notes
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Provide internal review rationale, company verification comments, or compliance notes..."
                    rows={3}
                    className="w-full rounded-xl border border-stocky-border-subtle bg-stocky-bg-global p-3 text-xs text-stocky-text-main focus:border-stocky-primary focus:outline-none transition-colors"
                  />
                </div>

                {isPending && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleReviewAction('reject')}
                      disabled={isProcessing}
                      className="h-9 px-4 rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <XIcon size="xs" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewAction('approve')}
                      disabled={isProcessing}
                      className="h-9 px-5 rounded-full bg-stocky-accent hover:bg-stocky-accent-hover text-stocky-text-main text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <CheckCircleIcon size="xs" />
                      <span>Approve & Activate Company</span>
                    </button>
                  </div>
                )}

                {isVerified && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-stocky-text-sub">
                      Verified {company.verifiedAt ? new Date(company.verifiedAt).toLocaleDateString() : 'Active'}
                    </div>
                    <button
                      type="button"
                      onClick={handleSuspendCompany}
                      disabled={isProcessing}
                      className="h-8.5 px-3.5 rounded-full border border-red-200 bg-white text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Suspend Company
                    </button>
                  </div>
                )}

                {isSuspended && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-xs text-red-700 font-medium">Access currently suspended.</span>
                    <button
                      type="button"
                      onClick={handleReactivateCompany}
                      disabled={isProcessing}
                      className="h-8.5 px-4 rounded-full bg-stocky-accent hover:bg-stocky-accent-hover text-stocky-text-main text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reactivate Company
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BRANCHES & FACILITIES */}
          {activeTab === 'branches' && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
                Registered Facilities & Locations
              </span>

              {branches.length > 0 ? (
                <div className="divide-y divide-stocky-border-subtle rounded-2xl border border-stocky-border-subtle bg-white overflow-hidden shadow-2xs">
                  {branches.map((b) => (
                    <div key={b.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle shrink-0">
                          <WarehouseIcon size="xs" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-stocky-text-main block">
                            {b.name}
                          </span>
                          <span className="text-[10px] text-stocky-text-sub font-mono">
                            {b.code || 'BR-01'}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          b.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Archived'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-stocky-border-subtle bg-white text-center text-xs text-stocky-text-sub">
                  Initial primary branch: <strong>{company.initialBranchName || 'Main Branch'}</strong> (provisions upon approval)
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM & USERS */}
          {activeTab === 'team' && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
                Company Users & Roles
              </span>

              {users.length > 0 ? (
                <div className="divide-y divide-stocky-border-subtle rounded-2xl border border-stocky-border-subtle bg-white overflow-hidden shadow-2xs">
                  {users.map((u) => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar email={u.email} size="sm" />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stocky-text-main block truncate">
                            {u.email}
                          </span>
                          <span className="text-[10px] text-stocky-text-sub uppercase font-bold tracking-wider">
                            Role: {u.role}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stocky-bg-global border border-stocky-border-subtle text-stocky-text-sub">
                        {u.status || 'active'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-stocky-border-subtle bg-white text-center text-xs text-stocky-text-sub">
                  Primary Owner: <strong>{company.requestedEmail}</strong> (registered as owner upon approval)
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCTS & STOCK */}
          {activeTab === 'products' && (
            <div className="space-y-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-stocky-text-sub block">
                Catalog Products Sample ({products.length})
              </span>

              {products.length > 0 ? (
                <div className="divide-y divide-stocky-border-subtle rounded-2xl border border-stocky-border-subtle bg-white overflow-hidden shadow-2xs">
                  {products.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle shrink-0">
                          <BoxIcon size="xs" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stocky-text-main block truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-stocky-text-sub font-mono">
                            SKU: {p.sku || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="text-xs font-semibold text-stocky-text-main block">
                          ${p.price?.toFixed(2) || '0.00'}
                        </span>
                        <span className="text-[10px] text-stocky-text-sub block">
                          Cost: ${p.cost?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-stocky-border-subtle bg-white text-center text-xs text-stocky-text-sub">
                  No catalog products imported yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SideDrawer>
  );
}
