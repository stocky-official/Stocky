'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  CloudDownloadIcon,
  RefreshIcon,
  SearchIcon,
  WarehouseIcon,
  XIcon,
} from '@stocky/icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { supabase } from '@/lib/supabase/client';
import {
  AdminCompanyItem,
  AdminCompanyProfileDrawerWidget,
} from '@/widgets/AdminCompanyProfileDrawerWidget/AdminCompanyProfileDrawerWidget';

function CompanyLogoAvatar({
  logoUrl,
  name,
  size = 'md',
}: {
  logoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(logoUrl || null);
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (name || 'C').trim().slice(0, 2).toUpperCase();

  const sizeClass =
    size === 'lg'
      ? 'h-12 w-12 rounded-2xl text-base'
      : size === 'sm'
      ? 'h-7 w-7 rounded-lg text-[10px]'
      : 'h-9 w-9 rounded-xl text-xs';

  useEffect(() => {
    let isCancelled = false;
    setImgFailed(false);
    if (logoUrl && !logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
      supabase.storage
        .from('stocky-private')
        .createSignedUrl(logoUrl.replace(/^\/+/, ''), 60 * 60 * 24)
        .then(({ data }) => {
          if (!isCancelled && data?.signedUrl) {
            setResolvedUrl(data.signedUrl);
          }
        })
        .catch(() => {
          if (!isCancelled) setResolvedUrl(null);
        });
    } else {
      setResolvedUrl(logoUrl || null);
    }
    return () => {
      isCancelled = true;
    };
  }, [logoUrl]);

  if (resolvedUrl && !imgFailed) {
    return (
      <img
        src={resolvedUrl}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
        className={`${sizeClass} object-cover border border-stocky-border-subtle shrink-0 bg-white shadow-2xs`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center bg-stocky-bg-global text-stocky-primary border border-stocky-border-subtle shrink-0 font-bold select-none`}
    >
      {initials}
    </div>
  );
}

export function AdminCompaniesView() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status');
  const initialIdParam = searchParams.get('id');

  const [companies, setCompanies] = useState<AdminCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');

  // Drawer selection
  const [selectedCompany, setSelectedCompany] = useState<AdminCompanyItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync url param if present
  useEffect(() => {
    if (initialStatusParam === 'pending') {
      setStatusFilter('pending');
    }
  }, [initialStatusParam]);

  const loadCompaniesData = useCallback(async () => {
    try {
      // 1. Fetch from companies table
      const { data: verifiedCompanies } = await supabase
        .from('companies')
        .select('id, name, code, logo_url, status, verified_at, verification_note, created_at')
        .order('created_at', { ascending: false });

      // 2. Fetch from company_applications table
      const { data: applications } = await supabase
        .from('company_applications')
        .select('id, company_id, company_name, company_code, logo_path, status, requested_email, initial_branch_name, review_note, reviewed_at, created_at')
        .order('created_at', { ascending: false });

      // Build unified list
      const appMap = new Map((applications || []).map((app) => [app.company_id || app.id, app]));
      const items: AdminCompanyItem[] = [];

      // Process verified companies
      (verifiedCompanies || []).forEach((c) => {
        const app = (applications || []).find((a) => a.company_id === c.id);
        items.push({
          id: c.id,
          companyId: c.id,
          applicationId: app?.id || null,
          name: c.name,
          code: c.code,
          logoUrl: c.logo_url,
          status: c.status as any,
          initialBranchName: app?.initial_branch_name || null,
          requestedEmail: app?.requested_email || 'Verified Company',
          reviewNote: c.verification_note || app?.review_note || null,
          verifiedAt: c.verified_at,
          createdAt: c.created_at,
        });
      });

      // Process applications not yet mapped to a created company (e.g. pending or rejected)
      (applications || []).forEach((app) => {
        const alreadyAdded = items.some((item) => item.companyId === app.company_id || item.applicationId === app.id);
        if (!alreadyAdded) {
          items.push({
            id: app.id,
            companyId: app.company_id || null,
            applicationId: app.id,
            name: app.company_name,
            code: app.company_code,
            logoUrl: app.logo_path,
            status: app.status as any,
            initialBranchName: app.initial_branch_name,
            requestedEmail: app.requested_email,
            reviewNote: app.review_note,
            verifiedAt: app.reviewed_at,
            createdAt: app.created_at,
          });
        }
      });

      // Batch create signed URLs for private storage logo paths
      const pathsToSign = items
        .map((it) => it.logoUrl)
        .filter((url): url is string => Boolean(url && !url.startsWith('http://') && !url.startsWith('https://')));

      if (pathsToSign.length > 0) {
        const uniquePaths = Array.from(new Set(pathsToSign.map((p) => p.replace(/^\/+/, ''))));
        try {
          const { data: signedResults } = await supabase.storage
            .from('stocky-private')
            .createSignedUrls(uniquePaths, 60 * 60 * 24);

          if (signedResults) {
            const signedMap = new Map<string, string>();
            for (const res of signedResults) {
              if (res.signedUrl && !res.error) {
                signedMap.set(res.path || '', res.signedUrl);
              }
            }

            for (const it of items) {
              if (it.logoUrl) {
                const clean = it.logoUrl.replace(/^\/+/, '');
                if (signedMap.has(clean)) {
                  it.logoUrl = signedMap.get(clean)!;
                }
              }
            }
          }
        } catch (storageErr) {
          console.warn('Failed to batch sign company logo URLs:', storageErr);
        }
      }

      setCompanies(items);

      // Auto-open drawer if requested via ?id=...
      if (initialIdParam) {
        const found = items.find((it) => it.id === initialIdParam || it.applicationId === initialIdParam || it.companyId === initialIdParam);
        if (found) {
          setSelectedCompany(found);
          setIsDrawerOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to load companies data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialIdParam]);

  useEffect(() => {
    loadCompaniesData();
  }, [loadCompaniesData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCompaniesData();
  };

  // Filter and search
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && c.status !== 'pending') return false;
        if (statusFilter === 'verified' && c.status !== 'verified') return false;
        if (statusFilter === 'rejected' && c.status !== 'rejected' && c.status !== 'suspended') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchCode = (c.code || '').toLowerCase().includes(q);
        const matchEmail = c.requestedEmail.toLowerCase().includes(q);
        const matchBranch = (c.initialBranchName || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchBranch) return false;
      }

      return true;
    });
  }, [companies, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: companies.length,
      pending: companies.filter((c) => c.status === 'pending').length,
      verified: companies.filter((c) => c.status === 'verified').length,
      rejected: companies.filter((c) => c.status === 'rejected' || c.status === 'suspended').length,
    };
  }, [companies]);

  const handleExportCSV = () => {
    const headers = ['Company Name', 'Slug/Code', 'Status', 'Applicant Email', 'Initial Branch', 'Created At'];
    const rows = filteredCompanies.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.code || '').replace(/"/g, '""')}"`,
      c.status,
      `"${c.requestedEmail.replace(/"/g, '""')}"`,
      `"${(c.initialBranchName || '').replace(/"/g, '""')}"`,
      c.createdAt,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocky_companies_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 text-start">
      {/* 2-Tier Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stocky-text-main tracking-tight">
            Companies Directory
          </h1>
          <p className="text-xs sm:text-sm text-stocky-text-sub mt-1">
            Review onboarding applications, verify new tenants, and inspect company infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            icon={<RefreshIcon size="xs" className={refreshing ? 'animate-spin' : ''} />}
            className="rounded-full text-xs h-9"
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<CloudDownloadIcon size="xs" />}
            className="rounded-full text-xs h-9"
          >
            Export Directory
          </Button>
        </div>
      </header>

      {/* Unified Workspace Card */}
      <div className="stocky-stock-unified-card rounded-2xl bg-white border border-stocky-border-subtle shadow-sm flex flex-col overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-3 sm:p-3.5 border-b border-stocky-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <SearchIcon
              size="xs"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stocky-text-sub rtl:left-auto rtl:right-3.5"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name, code, or owner email..."
              className="w-full h-10 rounded-full border border-stocky-border-subtle bg-stocky-bg-global pl-9 pr-9 rtl:pl-9 rtl:pr-9 text-xs text-stocky-text-main placeholder:text-stocky-text-sub focus:border-stocky-primary focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stocky-text-sub hover:text-stocky-text-main rtl:right-auto rtl:left-3"
              >
                <XIcon size="xs" />
              </button>
            )}
          </div>

          {/* Queue Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className={`h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'border-stocky-primary bg-stocky-primary/10 text-stocky-primary font-semibold'
                  : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-stocky-primary hover:text-stocky-primary'
              }`}
            >
              <span>All Companies</span>
              <span className="text-[10px] opacity-75">({counts.all})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
              className={`h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                statusFilter === 'pending'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                  : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-amber-500'
              }`}
            >
              <span>Pending Review</span>
              {counts.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'verified'}
              onClick={() => setStatusFilter('verified')}
              className={`h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                statusFilter === 'verified'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                  : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-emerald-500'
              }`}
            >
              <span>Verified</span>
              <span className="text-[10px] opacity-75">({counts.verified})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'rejected'}
              onClick={() => setStatusFilter('rejected')}
              className={`h-10 px-4 rounded-full text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                statusFilter === 'rejected'
                  ? 'border-slate-500 bg-slate-100 text-slate-800 font-bold'
                  : 'border border-stocky-border-subtle bg-white text-stocky-text-main hover:border-slate-500'
              }`}
            >
              <span>Rejected / Suspended</span>
              <span className="text-[10px] opacity-75">({counts.rejected})</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-xs text-stocky-text-sub">
              Loading companies directory...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <WarehouseIcon size="md" className="mx-auto text-stocky-text-sub/50" />
              <p className="text-sm font-semibold text-stocky-text-main">No companies found</p>
              <p className="text-xs text-stocky-text-sub">
                Try adjusting your search terms or filter status tabs.
              </p>
            </div>
          ) : (
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-stocky-border-subtle bg-stocky-bg-global/50 text-[11px] uppercase tracking-wider text-stocky-text-sub font-semibold">
                  <th className="py-3 px-4 text-start">Company</th>
                  <th className="py-3 px-4 text-start">Status</th>
                  <th className="py-3 px-4 text-start">Applicant / Owner</th>
                  <th className="py-3 px-4 text-start">Initial Branch</th>
                  <th className="py-3 px-4 text-start">Applied Date</th>
                  <th className="py-3 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stocky-border-subtle">
                {filteredCompanies.map((company) => {
                  const isPending = company.status === 'pending';
                  const isVerified = company.status === 'verified';

                  return (
                    <tr
                      key={company.id}
                      onClick={() => {
                        setSelectedCompany(company);
                        setIsDrawerOpen(true);
                      }}
                      className="hover:bg-stocky-bg-global/40 transition-colors cursor-pointer group"
                    >
                      {/* Company Name & Slug */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <CompanyLogoAvatar logoUrl={company.logoUrl} name={company.name} size="md" />
                          <div className="min-w-0">
                            <span className="font-semibold text-stocky-text-main group-hover:text-stocky-primary transition-colors block truncate">
                              {company.name}
                            </span>
                            <span className="font-mono text-[10px] text-stocky-text-sub block">
                              /{company.code || 'no-slug'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
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
                      </td>

                      {/* Owner Email */}
                      <td className="py-3.5 px-4 max-w-[220px] truncate">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar email={company.requestedEmail} size="xs" />
                          <span className="text-stocky-text-main truncate">
                            {company.requestedEmail}
                          </span>
                        </div>
                      </td>

                      {/* Initial Branch */}
                      <td className="py-3.5 px-4 text-stocky-text-sub whitespace-nowrap">
                        {company.initialBranchName || 'Main Branch'}
                      </td>

                      {/* Applied Date */}
                      <td className="py-3.5 px-4 text-stocky-text-sub whitespace-nowrap">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>

                      {/* Quick Inspect Button */}
                      <td className="py-3.5 px-4 text-end whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompany(company);
                            setIsDrawerOpen(true);
                          }}
                          className={`h-8 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer ${
                            isPending
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold'
                              : 'border border-stocky-border-subtle bg-white hover:border-stocky-primary hover:text-stocky-primary text-stocky-text-main'
                          }`}
                        >
                          <span>{isPending ? 'Review Application' : 'Inspect'}</span>
                          <ChevronRightIcon size="xs" className="rtl:rotate-180" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Company Profile Drawer */}
      <AdminCompanyProfileDrawerWidget
        company={selectedCompany}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCompany(null);
        }}
        onUpdated={loadCompaniesData}
      />
    </div>
  );
}
